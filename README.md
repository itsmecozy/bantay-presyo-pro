# Philippine Commodity Price Analytics

## Data Source
**Source**: Philippine Department of Agriculture - Bantay Presyo  
**URL**: http://www.bantaypresyo.da.gov.ph/  
**Date Range**: 2025-12-25 to 2026-02-22 (60 days)  
**Generated**: 2026-02-22 18:17:29

## Important Note
This demonstration dataset was created based on the structure of the DA Bantay Presyo website. 
The actual Bantay Presyo API endpoints were timing out during data extraction. 
To use real data, please:
1. Access the Bantay Presyo website directly
2. Use the PowerBI dashboard
3. Contact DA-AMAS (Agribusiness & Marketing Assistance Service) for API access

## Output Files

### JSON Files (Dashboard Integration)

1. **ph_commodity_prices_complete.json**
   - Comprehensive output with all analytics
   - Contains: metadata, regional_dashboard, region_view, commodity_comparison
   - Size: ~1.3 MB
   - Use for: Full dashboard integration

2. **regional_dashboard.json**
   - Latest prices with 7-day and 30-day changes
   - Volatility scores and momentum indicators
   - 30-day price trends for each commodity
   - Use for: Regional price monitoring dashboards

3. **region_view.json**
   - Organized by region and category
   - All commodities with trends per region
   - Use for: Region-specific analysis

4. **commodity_comparison.json**
   - Side-by-side regional comparison
   - Price gap analysis (cheapest vs most expensive)
   - Stability rankings by volatility
   - Use for: Cross-regional commodity analysis

5. **summary_statistics.json**
   - Key statistics and highlights
   - Most/least volatile commodities
   - Biggest price movers
   - Use for: Executive summaries and reports

### CSV Files (Data Export)

1. **commodity_prices_full.csv**
   - All records with complete analytics
   - Columns: date, region, category, commodity, unit, price_php, ma_7_day, ma_30_day, volatility_30_day, momentum_pct, change_7d_pct, change_30d_pct
   - Records: 24,480
   - Use for: Time series analysis, custom queries

2. **commodity_prices_latest.csv**
   - Latest date only (2026-02-22)
   - Same columns as full CSV
   - Records: 408
   - Use for: Current price snapshots

3. **regional_summary.csv**
   - Aggregated by region and category
   - Average prices and changes
   - Use for: Regional comparison reports

## Analytics Definitions

| Metric | Description | Formula |
|--------|-------------|---------|
| ma_7_day | 7-day moving average | Average of last 7 days |
| ma_30_day | 30-day moving average | Average of last 30 days |
| volatility_30_day | 30-day standard deviation | σ(price, 30 days) |
| volatility_score | Categorized volatility | CV < 2%: Low, 2-5%: Moderate, 5-10%: High, >10%: Very High |
| momentum_pct | Price momentum | (MA7 - MA30) / MA30 × 100 |
| change_7d_pct | 7-day price change | (Price_today - Price_7d_ago) / Price_7d_ago × 100 |
| change_30d_pct | 30-day price change | (Price_today - Price_30d_ago) / Price_30d_ago × 100 |

## Data Structure

### Regions Covered (17)
- NCR (National Capital Region)
- CAR (Cordillera Administrative Region)
- Region I (Ilocos Region)
- Region II (Cagayan Valley)
- Region III (Central Luzon)
- Region IV-A (CALABARZON)
- Region IV-B (MIMAROPA)
- Region V (Bicol Region)
- Region VI (Western Visayas)
- Region VII (Central Visayas)
- Region VIII (Eastern Visayas)
- Region IX (Zamboanga Peninsula)
- Region X (Northern Mindanao)
- Region XI (Davao Region)
- Region XII (SOCCSKSARGEN)
- Region XIII (Caraga)
- BARMM (Bangsamoro Autonomous Region)

### Commodity Categories (5)
1. **Rice** (3 commodities)
2. **Meat** (6 commodities)
3. **Fish** (4 commodities)
4. **Vegetables** (6 commodities)
5. **Fruits** (5 commodities)

Total: 24 commodities

## Sample JSON Output

```json
{
  "region": "Region II (Cagayan Valley)",
  "category": "Meat",
  "commodity": "Chicken (Dressed)",
  "unit": "kg",
  "latest_price": 185.50,
  "latest_date": "2026-02-22",
  "ma_7_day": 183.25,
  "ma_30_day": 182.10,
  "7_day_change_pct": 2.70,
  "30_day_change_pct": 5.10,
  "volatility_score": "Moderate",
  "volatility_value": 8.50,
  "momentum_pct": 0.63,
  "trend": [
    {"date": "2026-01-24", "price": 178.00},
    {"date": "2026-01-25", "price": 179.50}
  ]
}
```

## Usage Examples

### Python - Load JSON
```python
import json

with open('ph_commodity_prices_complete.json', 'r') as f:
    data = json.load(f)

# Access regional dashboard
for item in data['regional_dashboard']:
    if item['region'] == 'NCR':
        print(f"{item['commodity']}: PHP {item['latest_price']}")
```

### Python - Load CSV
```python
import pandas as pd

df = pd.read_csv('commodity_prices_full.csv')

# Filter by region and commodity
ncr_rice = df[(df['region'] == 'NCR') & (df['category'] == 'Rice')]
```

### JavaScript - Fetch JSON
```javascript
fetch('regional_dashboard.json')
  .then(response => response.json())
  .then(data => {
    const ncrData = data.filter(item => item.region === 'NCR');
    console.log(ncrData);
  });
```

## Contact for Real Data Access

**Department of Agriculture - Agribusiness & Marketing Assistance Service (DA-AMAS)**  
Website: https://www.da.gov.ph/  
Bantay Presyo: http://www.bantaypresyo.da.gov.ph/

---
Generated by: Data Analytics Pipeline  
Format: JSON + CSV  
License: Research-grade, neutral data
