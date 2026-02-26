"""
Bantay Presyo Scraper
=====================
Scrapes real-time commodity price data from the Philippine Department of
Agriculture's Bantay Presyo website (http://www.bantaypresyo.da.gov.ph/).

Usage:
    python bantay_scraper.py                    # Scrape all categories
    python bantay_scraper.py --category meat    # Scrape one category
    python bantay_scraper.py --region 3         # Scrape one region
    python bantay_scraper.py --dry-run          # Test without saving

Requirements:
    pip install requests beautifulsoup4 pandas
"""

import requests
import json
import time
import logging
import argparse
import sys
from datetime import datetime, date
from pathlib import Path
from typing import Optional
from bs4 import BeautifulSoup

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────

BASE_URL = "http://www.bantaypresyo.da.gov.ph"

# Map of category slug → URL path
CATEGORIES = {
    "rice":       "/tbl_rice.php",
    "meat":       "/tbl_meat.php",
    "fish":       "/tbl_fish.php",
    "vegetables": "/tbl_veg.php",
    "fruits":     "/tbl_fruit.php",
}

# DA Bantay Presyo region IDs (as used in their query params)
REGIONS = {
    1:  "CAR (Cordillera Administrative Region)",
    2:  "Region I (Ilocos Region)",
    3:  "Region II (Cagayan Valley)",
    4:  "Region III (Central Luzon)",
    5:  "Region IV-A (CALABARZON)",
    6:  "Region IV-B (MIMAROPA)",
    7:  "Region V (Bicol Region)",
    8:  "Region VI (Western Visayas)",
    9:  "Region VII (Central Visayas)",
    10: "Region VIII (Eastern Visayas)",
    11: "Region IX (Zamboanga Peninsula)",
    12: "Region X (Northern Mindanao)",
    13: "Region XI (Davao Region)",
    14: "Region XII (SOCCSKSARGEN)",
    15: "Region XIII (Caraga)",
    16: "NCR (National Capital Region)",
    17: "BARMM (Bangsamoro Autonomous Region)",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": BASE_URL,
}

# ─── Session ──────────────────────────────────────────────────────────────────

def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


# ─── Page Fetching ────────────────────────────────────────────────────────────

def fetch_page(
    session: requests.Session,
    url: str,
    params: Optional[dict] = None,
    retries: int = 3,
    delay: float = 2.0,
) -> Optional[str]:
    """Fetch a page with retries and polite delay."""
    for attempt in range(1, retries + 1):
        try:
            resp = session.get(url, params=params, timeout=30)
            resp.raise_for_status()
            time.sleep(delay)
            return resp.text
        except requests.RequestException as e:
            log.warning(f"Attempt {attempt}/{retries} failed for {url}: {e}")
            if attempt < retries:
                time.sleep(delay * attempt)
    log.error(f"All retries failed for {url}")
    return None


# ─── Parsing ──────────────────────────────────────────────────────────────────

def parse_market_table(html: str, region_name: str, category: str) -> dict:
    """
    Parse the market price HTML table from Bantay Presyo.

    Returns a dict with:
        date: str
        markets: list[str]
        commodities: list[{commodity, specification, prices: list[str]}]
    """
    soup = BeautifulSoup(html, "html.parser")

    # Find the date (usually in a <span> or <td> near the top)
    report_date = datetime.now().strftime("%Y-%m-%d")  # fallback
    date_candidates = soup.find_all(string=lambda t: t and "as of" in t.lower())
    for dc in date_candidates:
        try:
            raw = dc.strip().lower().replace("as of", "").strip()
            parsed = datetime.strptime(raw, "%B %d, %Y")
            report_date = parsed.strftime("%Y-%m-%d")
            break
        except ValueError:
            continue

    # Find the main data table
    tables = soup.find_all("table")
    data_table = None
    for tbl in tables:
        headers = [th.get_text(strip=True) for th in tbl.find_all("th")]
        if any("market" in h.lower() or "commodity" in h.lower() for h in headers):
            data_table = tbl
            break

    if data_table is None:
        # Try finding any table with enough columns
        for tbl in tables:
            rows = tbl.find_all("tr")
            if len(rows) > 3:
                first_row_cells = rows[0].find_all(["td", "th"])
                if len(first_row_cells) > 4:
                    data_table = tbl
                    break

    if data_table is None:
        log.warning(f"No data table found for {region_name} / {category}")
        return {"date": report_date, "markets": [], "commodities": []}

    rows = data_table.find_all("tr")
    if not rows:
        return {"date": report_date, "markets": [], "commodities": []}

    # ── Header row: extract market names ─────────────────────────────────────
    header_cells = rows[0].find_all(["th", "td"])
    # First cell = "Commodity", second = "Spec/Type", rest = market names
    markets = []
    for cell in header_cells[2:]:
        txt = cell.get_text(separator=" ", strip=True)
        if txt and txt.upper() not in ("RANGE", "MIN", "MAX", "AVG"):
            markets.append(txt.upper())

    # ── Data rows ─────────────────────────────────────────────────────────────
    commodities = []
    for row in rows[1:]:
        cells = row.find_all(["td", "th"])
        if len(cells) < 3:
            continue

        commodity = cells[0].get_text(strip=True)
        specification = cells[1].get_text(strip=True) if len(cells) > 1 else ""

        # Skip header-like rows
        if not commodity or commodity.upper() in ("COMMODITY", "ITEM"):
            continue

        prices = []
        for cell in cells[2: 2 + len(markets)]:
            raw = cell.get_text(strip=True)
            # Normalise: strip commas, currency signs, whitespace
            clean = raw.replace(",", "").replace("₱", "").replace("PHP", "").strip()
            if clean in ("", "-", "N/A", "n/a", "na", "NA", "*"):
                prices.append("N/A")
            else:
                try:
                    prices.append(f"{float(clean):.2f}")
                except ValueError:
                    prices.append("N/A")

        # Pad prices if some markets had no data column
        while len(prices) < len(markets):
            prices.append("N/A")

        commodities.append({
            "commodity": commodity,
            "specification": specification,
            "prices": prices,
        })

    return {
        "date": report_date,
        "markets": markets,
        "commodities": commodities,
    }


def parse_ajax_prices(html: str) -> list[dict]:
    """
    Some Bantay Presyo pages load price data via AJAX as JSON.
    Try to detect and parse those responses.
    """
    try:
        data = json.loads(html)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "data" in data:
            return data["data"]
    except json.JSONDecodeError:
        pass
    return []


# ─── Scraping Orchestration ───────────────────────────────────────────────────

def scrape_category_region(
    session: requests.Session,
    category_slug: str,
    region_id: int,
    region_name: str,
) -> Optional[dict]:
    """Scrape one category × region combination."""
    url = BASE_URL + CATEGORIES[category_slug]
    params = {"rid": region_id}  # Bantay Presyo uses ?rid=X for region filter

    log.info(f"  Fetching {category_slug.upper()} / {region_name}...")
    html = fetch_page(session, url, params=params)
    if html is None:
        return None

    result = parse_market_table(html, region_name, category_slug)
    result["region"] = region_name
    result["category"] = category_slug.capitalize()
    return result


def scrape_all(
    categories_to_scrape: Optional[list] = None,
    regions_to_scrape: Optional[list] = None,
) -> dict:
    """
    Scrape all (or selected) category × region combinations.

    Returns the full market_comparison_data structure ready for the dashboard.
    """
    session = make_session()

    cats = categories_to_scrape or list(CATEGORIES.keys())
    regs = regions_to_scrape or list(REGIONS.keys())

    result = {"regions": {}, "scrape_metadata": {}}
    scraped_at = datetime.now().isoformat()

    total = len(cats) * len(regs)
    done = 0

    for region_id in regs:
        region_name = REGIONS[region_id]
        if region_name not in result["regions"]:
            result["regions"][region_name] = {}

        for cat_slug in cats:
            done += 1
            log.info(f"[{done}/{total}] {region_name} — {cat_slug}")

            data = scrape_category_region(session, cat_slug, region_id, region_name)
            if data and data["commodities"]:
                cat_label = cat_slug.capitalize()
                result["regions"][region_name][cat_label] = {
                    "date": data["date"],
                    "markets": data["markets"],
                    "commodities": data["commodities"],
                }
                log.info(
                    f"    ✓ {len(data['markets'])} markets, "
                    f"{len(data['commodities'])} commodities"
                )
            else:
                log.warning(f"    ✗ No data returned")

            # Polite delay between requests
            time.sleep(1.5)

    result["scrape_metadata"] = {
        "scraped_at": scraped_at,
        "source": BASE_URL,
        "regions_attempted": len(regs),
        "categories_attempted": len(cats),
        "regions_with_data": sum(
            1 for r in result["regions"].values() if r
        ),
    }

    return result


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Bantay Presyo Scraper")
    parser.add_argument(
        "--category",
        choices=list(CATEGORIES.keys()),
        help="Scrape only this category",
    )
    parser.add_argument(
        "--region",
        type=int,
        choices=list(REGIONS.keys()),
        help="Scrape only this region ID (1-17)",
    )
    parser.add_argument(
        "--output",
        default="output/market_comparison_data.json",
        help="Output JSON file path",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be scraped without fetching",
    )
    args = parser.parse_args()

    cats = [args.category] if args.category else None
    regs = [args.region] if args.region else None

    if args.dry_run:
        print("DRY RUN — would scrape:")
        for rid, rname in REGIONS.items():
            if regs and rid not in regs:
                continue
            for cslug in (cats or CATEGORIES.keys()):
                print(f"  Region {rid} ({rname}) / {cslug}")
        return

    Path("logs").mkdir(exist_ok=True)
    Path("output").mkdir(exist_ok=True)

    log.info("=== Bantay Presyo Scraper Starting ===")
    data = scrape_all(cats, regs)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    log.info(f"=== Done. Output saved to {out_path} ===")
    meta = data["scrape_metadata"]
    log.info(
        f"    Regions with data: {meta['regions_with_data']} / {meta['regions_attempted']}"
    )


if __name__ == "__main__":
    main()
