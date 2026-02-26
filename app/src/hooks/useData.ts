import { useState, useEffect } from 'react';
import type { DashboardItem, CommodityComparison, RegionView, SummaryStats } from '@/types';

interface DataState {
  dashboard: DashboardItem[];
  comparison: Record<string, CommodityComparison>;
  regionView: Record<string, RegionView>;
  summary: SummaryStats | null;
  loading: boolean;
  error: string | null;
}

export function useData(): DataState {
  const [data, setData] = useState<DataState>({
    dashboard: [],
    comparison: {},
    regionView: {},
    summary: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, comparisonRes, regionViewRes, summaryRes] = await Promise.all([
          fetch('/data/regional_dashboard.json'),
          fetch('/data/commodity_comparison.json'),
          fetch('/data/region_view.json'),
          fetch('/data/summary_statistics.json')
        ]);

        const [dashboard, comparison, regionView, summary] = await Promise.all([
          dashboardRes.json(),
          comparisonRes.json(),
          regionViewRes.json(),
          summaryRes.json()
        ]);

        setData({
          dashboard,
          comparison,
          regionView,
          summary,
          loading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load data. Please try again later.'
        }));
      }
    }

    fetchData();
  }, []);

  return data;
}

export function useFilteredDashboard(
  dashboard: DashboardItem[],
  filters: {
    region?: string;
    category?: string;
    search?: string;
  }
): DashboardItem[] {
  return dashboard.filter(item => {
    if (filters.region && filters.region !== 'All Regions' && item.region !== filters.region) {
      return false;
    }
    if (filters.category && filters.category !== 'All Categories' && item.category !== filters.category) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        item.commodity.toLowerCase().includes(searchLower) ||
        item.region.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
}

export function useCategoryStats(dashboard: DashboardItem[]) {
  const stats: Record<string, {
    count: number;
    avgPrice: number;
    avgChange7d: number;
    avgChange30d: number;
  }> = {};

  dashboard.forEach(item => {
    if (!stats[item.category]) {
      stats[item.category] = { count: 0, avgPrice: 0, avgChange7d: 0, avgChange30d: 0 };
    }
    stats[item.category].count++;
    stats[item.category].avgPrice += item.latest_price;
    if (item['7_day_change_pct'] !== null) {
      stats[item.category].avgChange7d += item['7_day_change_pct'];
    }
    if (item['30_day_change_pct'] !== null) {
      stats[item.category].avgChange30d += item['30_day_change_pct'];
    }
  });

  // Calculate averages
  Object.keys(stats).forEach(cat => {
    const s = stats[cat];
    s.avgPrice = Math.round((s.avgPrice / s.count) * 100) / 100;
    s.avgChange7d = Math.round((s.avgChange7d / s.count) * 100) / 100;
    s.avgChange30d = Math.round((s.avgChange30d / s.count) * 100) / 100;
  });

  return stats;
}
