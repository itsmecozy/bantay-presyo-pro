# Bantay Presyo Pro — Setup & Deployment Guide

This guide covers how to get real data flowing into the dashboard and deploy it to the web.

---

## Overview

The system has three parts:

```
scraper/bantay_scraper.py        ← fetches data from bantaypresyo.da.gov.ph
pipeline/build_dashboard_data.py ← transforms raw data into dashboard JSON files
app/                             ← the React dashboard
```

---

## 1. Quick Start (Local)

### Prerequisites

```bash
# Python
pip install requests beautifulsoup4

# Node.js (for the app)
cd app && npm install
```

### Run a full scrape + build

```bash
chmod +x run_pipeline.sh
./run_pipeline.sh
```

This will:
1. Scrape all 17 regions × 5 categories from Bantay Presyo
2. Process and write JSON files into `app/public/data/`
3. If `app/dist/` exists, copy there too

### Run the app locally

```bash
cd app
npm run dev
# → http://localhost:5173
```

---

## 2. Scraper Options

```bash
# Scrape everything (all regions, all categories)
python3 scraper/bantay_scraper.py

# Scrape one category only
python3 scraper/bantay_scraper.py --category meat
python3 scraper/bantay_scraper.py --category rice
python3 scraper/bantay_scraper.py --category fish
python3 scraper/bantay_scraper.py --category vegetables
python3 scraper/bantay_scraper.py --category fruits

# Scrape one region (use region ID 1-17)
python3 scraper/bantay_scraper.py --region 16     # NCR
python3 scraper/bantay_scraper.py --region 1      # CAR

# Custom output path
python3 scraper/bantay_scraper.py --output my_data.json

# Dry run — see what would be scraped without fetching
python3 scraper/bantay_scraper.py --dry-run
```

### Region IDs

| ID | Region |
|----|--------|
| 1  | CAR (Cordillera Administrative Region) |
| 2  | Region I (Ilocos Region) |
| 3  | Region II (Cagayan Valley) |
| 4  | Region III (Central Luzon) |
| 5  | Region IV-A (CALABARZON) |
| 6  | Region IV-B (MIMAROPA) |
| 7  | Region V (Bicol Region) |
| 8  | Region VI (Western Visayas) |
| 9  | Region VII (Central Visayas) |
| 10 | Region VIII (Eastern Visayas) |
| 11 | Region IX (Zamboanga Peninsula) |
| 12 | Region X (Northern Mindanao) |
| 13 | Region XI (Davao Region) |
| 14 | Region XII (SOCCSKSARGEN) |
| 15 | Region XIII (Caraga) |
| 16 | NCR (National Capital Region) |
| 17 | BARMM (Bangsamoro Autonomous Region) |

---

## 3. If the Scraper Fails

The Bantay Presyo website occasionally:
- Changes its HTML structure
- Uses AJAX to load data
- Goes offline for maintenance

### Debugging steps

```bash
# Test fetching the raw page
curl "http://www.bantaypresyo.da.gov.ph/tbl_meat.php?rid=16" -o test.html
# Then inspect test.html to see the actual table structure

# Test with Python
python3 - << 'EOF'
import requests
from bs4 import BeautifulSoup
r = requests.get("http://www.bantaypresyo.da.gov.ph/tbl_meat.php", params={"rid": 16}, timeout=30)
soup = BeautifulSoup(r.text, "html.parser")
tables = soup.find_all("table")
print(f"Found {len(tables)} tables")
for i, t in enumerate(tables):
    rows = t.find_all("tr")
    cols = len(rows[0].find_all(["th","td"])) if rows else 0
    print(f"  Table {i}: {len(rows)} rows x {cols} cols")
EOF
```

### If the URL structure changed

Update the `CATEGORIES` dict in `scraper/bantay_scraper.py`:

```python
CATEGORIES = {
    "rice":       "/tbl_rice.php",     # ← update these paths
    "meat":       "/tbl_meat.php",
    "fish":       "/tbl_fish.php",
    "vegetables": "/tbl_veg.php",
    "fruits":     "/tbl_fruit.php",
}
```

### If region params changed

Update the `REGIONS` dict and the `params` in `scrape_category_region()`:

```python
# If the site switched from ?rid=X to ?region=X
params = {"region": region_id}   # ← change this line
```

---

## 4. Deploying to GitHub Pages (Free, Permanent URL)

### Step 1: Create a GitHub repository

```bash
# In the project root:
git init
git add .
git commit -m "initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/bantay-presyo-pro.git
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**

### Step 3: The workflow runs automatically

The `.github/workflows/daily-update.yml` file will:
- Run every day at 6 AM Philippine time
- Scrape fresh data from Bantay Presyo
- Rebuild the app
- Deploy to `https://YOUR_USERNAME.github.io/bantay-presyo-pro/`

You can also trigger it manually from the **Actions** tab on GitHub.

### Step 4 (optional): Custom domain

In `.github/workflows/daily-update.yml`, set:
```yaml
cname: "your-domain.com"
```

And point your domain's DNS to GitHub Pages.

---

## 5. Deploying to Vercel (Even Easier)

```bash
npm install -g vercel
cd app
npm run build
vercel --prod
```

Vercel will give you a permanent URL. For daily data updates, you'd still need the GitHub Actions scraper to commit data files, then Vercel picks up changes automatically via git integration.

---

## 6. Data File Reference

After running the pipeline, these files are written to `app/public/data/`:

| File | Used By | Description |
|------|---------|-------------|
| `market_comparison_data.json` | MarketComparison section | Raw market × commodity table |
| `regional_dashboard.json` | PriceExplorer, Rankings, Trends | Latest prices per region |
| `commodity_comparison.json` | CommodityComparison section | Cross-region price analysis |
| `region_view.json` | Regional drill-down | Region → category → commodity |
| `summary_statistics.json` | Hero section, Overview | KPIs and highlights |
| `commodity_prices_latest.csv` | Download button | Flat CSV export |

---

## 7. Running on a Schedule (Without GitHub)

If you want to run locally on a schedule:

### Linux/Mac (cron)

```bash
# Edit crontab
crontab -e

# Add this line to run at 6 AM daily:
0 6 * * * /path/to/project/run_pipeline.sh >> /path/to/project/scraper/logs/cron.log 2>&1
```

### Windows (Task Scheduler)

Create a task that runs `run_pipeline.sh` via Git Bash or WSL at your preferred time.

---

## 8. Troubleshooting

**"No data table found"** — The Bantay Presyo page loaded but the table parser couldn't find a matching table. Check the raw HTML with the debugging steps above.

**Prices all showing N/A** — The column alignment between markets and prices is off. Check if there are extra header rows or merged cells in the table.

**Build fails** — Run `cd app && npm run build` to see TypeScript/build errors before deploying.

**GitHub Actions fails** — Check the Actions tab for the specific error. Common causes: scraper timeout (site down), npm install failure, or git push permission issues.

---

## Contact for Real Data Access

**Department of Agriculture — Agribusiness & Marketing Assistance Service (DA-AMAS)**
- Website: https://www.da.gov.ph/
- Bantay Presyo: http://www.bantaypresyo.da.gov.ph/

For bulk data access or API credentials, contact DA-AMAS directly.
