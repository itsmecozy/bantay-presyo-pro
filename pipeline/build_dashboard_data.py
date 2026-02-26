"""
Dashboard Data Pipeline
=======================
Takes the raw market_comparison_data.json produced by the scraper and
generates all the JSON files the Bantay Presyo Pro dashboard needs:

    ├── market_comparison_data.json   (market × commodity table)
    ├── regional_dashboard.json       (latest prices + analytics per region)
    ├── commodity_comparison.json     (cross-regional commodity comparison)
    ├── region_view.json              (region → category → commodity view)
    ├── summary_statistics.json       (KPIs and highlights)
    └── commodity_prices_latest.csv   (flat CSV export)

Usage:
    python build_dashboard_data.py
    python build_dashboard_data.py --input path/to/market_data.json
    python build_dashboard_data.py --input scraped.json --output-dir ../app/public/data
"""

import json
import csv
import argparse
import statistics
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Optional

# ─── Helpers ──────────────────────────────────────────────────────────────────

def parse_price(raw: str) -> Optional[float]:
    """Return float or None for N/A / missing prices."""
    if raw in ("N/A", "n/a", "", None):
        return None
    try:
        return float(str(raw).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def safe_pct_change(new: float, old: float) -> Optional[float]:
    if old and old != 0:
        return round((new - old) / old * 100, 2)
    return None


def volatility_label(cv: Optional[float]) -> str:
    if cv is None:
        return "Unknown"
    if cv < 2:
        return "Low"
    if cv < 5:
        return "Moderate"
    if cv < 10:
        return "High"
    return "Very High"


# ─── Load Input ───────────────────────────────────────────────────────────────

def load_market_data(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ─── Flatten to Records ───────────────────────────────────────────────────────

def flatten_records(market_data: dict) -> list[dict]:
    """
    Convert the nested market_comparison_data into a flat list of records:
        [{ region, category, market, commodity, specification, price }, ...]
    """
    records = []
    scrape_date = datetime.now().strftime("%Y-%m-%d")

    for region_name, categories in market_data.get("regions", {}).items():
        for category, cat_data in categories.items():
            date = cat_data.get("date", scrape_date)
            markets = cat_data.get("markets", [])
            commodities = cat_data.get("commodities", [])

            for item in commodities:
                commodity = item["commodity"]
                spec = item.get("specification", "")
                prices = item.get("prices", [])

                for i, market in enumerate(markets):
                    price_str = prices[i] if i < len(prices) else "N/A"
                    price = parse_price(price_str)

                    records.append({
                        "date": date,
                        "region": region_name,
                        "category": category,
                        "market": market,
                        "commodity": commodity,
                        "specification": spec,
                        "price": price,
                    })

    return records


# ─── Regional Dashboard ───────────────────────────────────────────────────────

def build_regional_dashboard(records: list[dict]) -> list[dict]:
    """
    Aggregate to region × commodity level with price stats.
    Mirrors the DashboardItem type expected by the React app.
    """
    # Group by region + category + commodity
    groups = defaultdict(list)
    for r in records:
        if r["price"] is not None:
            key = (r["region"], r["category"], r["commodity"])
            groups[key].append(r)

    dashboard = []
    for (region, category, commodity), items in groups.items():
        prices = [it["price"] for it in items if it["price"] is not None]
        if not prices:
            continue

        avg_price = round(statistics.mean(prices), 2)
        spec = items[0].get("specification", "")
        date = items[0].get("date", "")

        # Coefficient of variation as proxy volatility
        if len(prices) > 1:
            stdev = statistics.stdev(prices)
            cv = (stdev / avg_price * 100) if avg_price else 0
        else:
            cv = 0

        vol_label = volatility_label(cv)

        # Trend: just the market-level prices sorted (no time series from one scrape)
        trend = [
            {"date": date, "price": p}
            for p in sorted(prices)
        ]

        dashboard.append({
            "region": region,
            "category": category,
            "commodity": commodity,
            "unit": _infer_unit(spec, category),
            "latest_price": avg_price,
            "latest_date": date,
            "ma_7": None,       # Requires time-series data (multiple scrapes)
            "ma_30": None,
            "7_day_change_pct": None,
            "30_day_change_pct": None,
            "volatility_score": vol_label,
            "volatility_value": round(cv, 2),
            "momentum": 0,
            "trend": trend,
            "price_min": min(prices),
            "price_max": max(prices),
            "markets_count": len(prices),
        })

    return sorted(dashboard, key=lambda x: (x["region"], x["category"], x["commodity"]))


def _infer_unit(spec: str, category: str) -> str:
    spec_lower = spec.lower()
    if "kg" in spec_lower:
        return "kg"
    if "pc" in spec_lower or "piece" in spec_lower:
        return "pc"
    if "sack" in spec_lower:
        return "sack"
    if "tray" in spec_lower:
        return "tray"
    cat_defaults = {
        "Rice": "kg",
        "Meat": "kg",
        "Fish": "kg",
        "Vegetables": "kg",
        "Fruits": "kg",
    }
    return cat_defaults.get(category, "kg")


# ─── Commodity Comparison ─────────────────────────────────────────────────────

def build_commodity_comparison(dashboard: list[dict]) -> dict:
    """
    For each commodity, compare prices across all regions.
    Mirrors the CommodityComparison type.
    """
    by_commodity = defaultdict(list)
    for item in dashboard:
        by_commodity[item["commodity"]].append(item)

    comparison = {}
    for commodity, items in by_commodity.items():
        prices = [it["latest_price"] for it in items]
        if not prices:
            continue

        regional_trends = sorted(
            [
                {
                    "region": it["region"],
                    "latest_price": it["latest_price"],
                    "7_day_change_pct": it["7_day_change_pct"],
                    "30_day_change_pct": it["30_day_change_pct"],
                    "volatility_score": it["volatility_score"],
                    "volatility_value": it["volatility_value"],
                    "momentum": it["momentum"],
                    "rank": 0,  # filled below
                }
                for it in items
            ],
            key=lambda x: x["latest_price"],
        )

        for rank, rt in enumerate(regional_trends, 1):
            rt["rank"] = rank

        comparison[commodity] = {
            "commodity": commodity,
            "category": items[0]["category"],
            "unit": items[0]["unit"],
            "latest_date": items[0]["latest_date"],
            "national_stats": {
                "min_price": min(prices),
                "max_price": max(prices),
                "avg_price": round(statistics.mean(prices), 2),
                "price_gap_pct": round(
                    (max(prices) - min(prices)) / min(prices) * 100, 2
                )
                if min(prices) > 0
                else 0,
            },
            "regional_trends": regional_trends,
            "stability_ranking": sorted(
                [
                    {
                        "rank": 0,
                        "region": it["region"],
                        "volatility_score": it["volatility_score"],
                        "volatility_value": it["volatility_value"],
                    }
                    for it in items
                    if it["volatility_value"] is not None
                ],
                key=lambda x: (x["volatility_value"] or 999),
            ),
        }

        # Assign stability ranks
        for rank, sr in enumerate(comparison[commodity]["stability_ranking"], 1):
            sr["rank"] = rank

    return comparison


# ─── Region View ──────────────────────────────────────────────────────────────

def build_region_view(dashboard: list[dict]) -> dict:
    """Region → category → commodities view. Mirrors RegionView type."""
    view = {}
    for item in dashboard:
        region = item["region"]
        category = item["category"]

        if region not in view:
            view[region] = {
                "region": region,
                "latest_date": item["latest_date"],
                "categories": {},
            }

        if category not in view[region]["categories"]:
            view[region]["categories"][category] = []

        view[region]["categories"][category].append({
            "commodity": item["commodity"],
            "unit": item["unit"],
            "latest_price": item["latest_price"],
            "7_day_change_pct": item["7_day_change_pct"],
            "30_day_change_pct": item["30_day_change_pct"],
            "volatility_score": item["volatility_score"],
            "momentum": item["momentum"],
            "trend": item["trend"],
        })

    return view


# ─── Summary Statistics ───────────────────────────────────────────────────────

def build_summary(
    dashboard: list[dict], market_data: dict
) -> dict:
    """Top-level KPIs and highlights. Mirrors SummaryStats type."""
    all_regions = sorted({it["region"] for it in dashboard})
    all_cats = sorted({it["category"] for it in dashboard})
    all_commodities = sorted({it["commodity"] for it in dashboard})

    # Category price ranges
    cat_stats = {}
    for cat in all_cats:
        items = [it for it in dashboard if it["category"] == cat]
        prices = [it["latest_price"] for it in items]
        if prices:
            cat_stats[cat] = {
                "commodities": len({it["commodity"] for it in items}),
                "min_price": round(min(prices), 2),
                "max_price": round(max(prices), 2),
                "avg_price": round(statistics.mean(prices), 2),
                "median_price": round(statistics.median(prices), 2),
            }

    # Most volatile
    volatile_items = sorted(
        [it for it in dashboard if it["volatility_value"] is not None],
        key=lambda x: x["volatility_value"],
        reverse=True,
    )[:10]

    # Most stable
    stable_items = sorted(
        [it for it in dashboard if it["volatility_value"] is not None and it["volatility_value"] > 0],
        key=lambda x: x["volatility_value"],
    )[:10]

    # Count total markets across all regions/categories
    total_markets = set()
    for region_cats in market_data.get("regions", {}).values():
        for cat_data in region_cats.values():
            for m in cat_data.get("markets", []):
                total_markets.add(m)

    latest_date = max((it["latest_date"] for it in dashboard), default="")

    return {
        "metadata": {
            "data_source": "Philippine Department of Agriculture - Bantay Presyo",
            "source_url": "http://www.bantaypresyo.da.gov.ph/",
            "generated_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "latest_data_date": latest_date,
            "regions_count": len(all_regions),
            "commodities_count": len(all_commodities),
            "markets_count": len(total_markets),
            "categories": all_cats,
        },
        "summary_statistics": {
            "total_records": len(dashboard),
            "latest_date": latest_date,
            "price_ranges_by_category": cat_stats,
            "most_volatile_commodities": [
                {
                    "commodity": it["commodity"],
                    "region": it["region"],
                    "volatility_value": it["volatility_value"],
                    "volatility_score": it["volatility_score"],
                }
                for it in volatile_items
            ],
            "most_stable_commodities": [
                {
                    "commodity": it["commodity"],
                    "region": it["region"],
                    "volatility_value": it["volatility_value"],
                    "volatility_score": it["volatility_score"],
                }
                for it in stable_items
            ],
            "biggest_price_increases_7d": [],   # Requires time-series data
            "biggest_price_decreases_7d": [],
        },
    }


# ─── CSV Export ───────────────────────────────────────────────────────────────

def export_csv(records: list[dict], path: str):
    """Export flat records to CSV."""
    if not records:
        return
    fieldnames = ["date", "region", "category", "market", "commodity", "specification", "price"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({k: r.get(k, "") for k in fieldnames})


# ─── Main ─────────────────────────────────────────────────────────────────────

def run(input_path: str, output_dir: str):
    print(f"Loading {input_path}...")
    market_data = load_market_data(input_path)

    print("Flattening records...")
    records = flatten_records(market_data)
    print(f"  {len(records)} price records found")

    if not records:
        print("ERROR: No records to process. Check the scraper output.")
        sys.exit(1)

    print("Building regional dashboard...")
    dashboard = build_regional_dashboard(records)
    print(f"  {len(dashboard)} dashboard items")

    print("Building commodity comparison...")
    comparison = build_commodity_comparison(dashboard)

    print("Building region view...")
    region_view = build_region_view(dashboard)

    print("Building summary statistics...")
    summary = build_summary(dashboard, market_data)

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    def save(filename: str, data):
        path = out / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        size = path.stat().st_size / 1024
        print(f"  ✓ {filename} ({size:.1f} KB)")

    print(f"\nSaving to {output_dir}/")
    save("market_comparison_data.json", market_data)
    save("regional_dashboard.json", dashboard)
    save("commodity_comparison.json", comparison)
    save("region_view.json", region_view)
    save("summary_statistics.json", summary)

    # CSV export
    csv_path = out / "commodity_prices_latest.csv"
    export_csv(records, str(csv_path))
    size = csv_path.stat().st_size / 1024
    print(f"  ✓ commodity_prices_latest.csv ({size:.1f} KB)")

    print("\n✅ Pipeline complete.")
    print(f"   Regions: {summary['metadata']['regions_count']}")
    print(f"   Commodities: {summary['metadata']['commodities_count']}")
    print(f"   Markets: {summary['metadata']['markets_count']}")


def main():
    parser = argparse.ArgumentParser(description="Bantay Presyo Dashboard Data Pipeline")
    parser.add_argument(
        "--input",
        default="output/market_comparison_data.json",
        help="Path to scraped market_comparison_data.json",
    )
    parser.add_argument(
        "--output-dir",
        default="../app/public/data",
        help="Directory to write dashboard JSON files",
    )
    args = parser.parse_args()
    run(args.input, args.output_dir)


if __name__ == "__main__":
    main()
