#!/usr/bin/env bash
# ============================================================
# run_pipeline.sh  —  Bantay Presyo full data pipeline
#
# Usage:
#   ./run_pipeline.sh               # Full scrape + build
#   ./run_pipeline.sh --skip-scrape # Build from existing output
#   ./run_pipeline.sh --dry-run     # Preview what would be scraped
#
# Requirements:
#   pip install requests beautifulsoup4
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRAPER="$SCRIPT_DIR/scraper/bantay_scraper.py"
PIPELINE="$SCRIPT_DIR/pipeline/build_dashboard_data.py"
SCRAPED="$SCRIPT_DIR/scraper/output/market_comparison_data.json"
APP_DATA="$SCRIPT_DIR/../app/public/data"

SKIP_SCRAPE=0
DRY_RUN=0

for arg in "$@"; do
  case $arg in
    --skip-scrape) SKIP_SCRAPE=1 ;;
    --dry-run) DRY_RUN=1 ;;
  esac
done

echo "========================================"
echo "  Bantay Presyo Data Pipeline"
echo "  $(date)"
echo "========================================"

mkdir -p "$SCRIPT_DIR/scraper/output"
mkdir -p "$SCRIPT_DIR/scraper/logs"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "[DRY RUN] Would scrape:"
  python3 "$SCRAPER" --dry-run
  exit 0
fi

if [[ $SKIP_SCRAPE -eq 0 ]]; then
  echo ""
  echo "→ Step 1: Scraping Bantay Presyo..."
  python3 "$SCRAPER" --output "$SCRAPED"
  echo "  Scrape complete."
else
  echo "→ Step 1: Skipping scrape (--skip-scrape)"
fi

if [[ ! -f "$SCRAPED" ]]; then
  echo "ERROR: $SCRAPED not found. Run without --skip-scrape first."
  exit 1
fi

echo ""
echo "→ Step 2: Building dashboard data files..."
python3 "$PIPELINE" --input "$SCRAPED" --output-dir "$APP_DATA"

echo ""
echo "→ Step 3: Copying to dist/ (if dist exists)..."
DIST_DATA="$SCRIPT_DIR/../app/dist/data"
if [[ -d "$DIST_DATA" ]]; then
  cp -r "$APP_DATA"/. "$DIST_DATA/"
  echo "  Copied to dist/data/"
else
  echo "  dist/ not found — run 'npm run build' in the app to create it."
fi

echo ""
echo "========================================"
echo "  ✅ Pipeline finished at $(date)"
echo "========================================"
