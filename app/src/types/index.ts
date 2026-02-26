// Types for commodity price data

export interface PriceTrend {
  date: string;
  price: number;
}

export interface DashboardItem {
  region: string;
  category: string;
  commodity: string;
  unit: string;
  latest_price: number;
  latest_date: string;
  ma_7: number | null;
  ma_30: number | null;
  '7_day_change_pct': number | null;
  '30_day_change_pct': number | null;
  volatility_score: string;
  volatility_value: number | null;
  momentum: number;
  trend: PriceTrend[];
}

export interface RegionalTrend {
  region: string;
  latest_price: number;
  '7_day_change_pct': number | null;
  '30_day_change_pct': number | null;
  volatility_score: string;
  volatility_value: number | null;
  momentum: number;
  rank: number;
}

export interface CommodityComparison {
  commodity: string;
  category: string;
  unit: string;
  latest_date: string;
  national_stats: {
    min_price: number;
    max_price: number;
    price_gap_pct: number;
    avg_price: number;
  };
  regional_trends: RegionalTrend[];
  stability_ranking: {
    rank: number;
    region: string;
    volatility_score: string;
    volatility_value: number | null;
  }[];
}

export interface CategoryCommodity {
  commodity: string;
  unit: string;
  latest_price: number;
  '7_day_change_pct': number | null;
  '30_day_change_pct': number | null;
  volatility_score: string;
  momentum: number;
  trend: PriceTrend[];
}

export interface RegionView {
  region: string;
  latest_date: string;
  categories: Record<string, CategoryCommodity[]>;
}

export interface SummaryStats {
  metadata: {
    data_source: string;
    generated_date: string;
    date_range: {
      start: string;
      end: string;
    };
    regions_count: number;
    commodities_count: number;
    categories: string[];
  };
  summary_statistics: {
    total_records: number;
    latest_date: string;
    price_ranges_by_category: Record<string, {
      commodities: number;
      min_price: number;
      max_price: number;
      avg_price: number;
      median_price: number;
    }>;
    most_volatile_commodities: {
      commodity: string;
      region: string;
      volatility_value: number;
      volatility_score: string;
    }[];
    most_stable_commodities: {
      commodity: string;
      region: string;
      volatility_value: number;
      volatility_score: string;
    }[];
    biggest_price_increases_7d: {
      commodity: string;
      region: string;
      change_7d_pct: number;
      latest_price: number;
    }[];
    biggest_price_decreases_7d: {
      commodity: string;
      region: string;
      change_7d_pct: number;
      latest_price: number;
    }[];
  };
}

export type Category = 'Rice' | 'Meat' | 'Fish' | 'Vegetables' | 'Fruits';

export const categories: Category[] = ['Rice', 'Meat', 'Fish', 'Vegetables', 'Fruits'];

export const categoryIcons: Record<Category, string> = {
  Rice: '🌾',
  Meat: '🥩',
  Fish: '🐟',
  Vegetables: '🥬',
  Fruits: '🍎'
};

export const regions = [
  'NCR (National Capital Region)',
  'CAR (Cordillera Administrative Region)',
  'Region I (Ilocos Region)',
  'Region II (Cagayan Valley)',
  'Region III (Central Luzon)',
  'Region IV-A (CALABARZON)',
  'Region IV-B (MIMAROPA)',
  'Region V (Bicol Region)',
  'Region VI (Western Visayas)',
  'Region VII (Central Visayas)',
  'Region VIII (Eastern Visayas)',
  'Region IX (Zamboanga Peninsula)',
  'Region X (Northern Mindanao)',
  'Region XI (Davao Region)',
  'Region XII (SOCCSKSARGEN)',
  'Region XIII (Caraga)',
  'BARMM (Bangsamoro Autonomous Region)'
];
  
