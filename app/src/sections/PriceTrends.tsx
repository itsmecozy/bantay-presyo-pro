import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DashboardItem } from '@/types';

interface PriceTrendsProps {
  dashboard: DashboardItem[];
}

export function PriceTrends({ dashboard }: PriceTrendsProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Get unique commodities and regions
  const commodities = useMemo(() => {
    const unique = new Set(dashboard.map(d => d.commodity));
    return Array.from(unique).sort();
  }, [dashboard]);

  const regions = useMemo(() => {
    if (!selectedCommodity) return [];
    const unique = new Set(
      dashboard
        .filter(d => d.commodity === selectedCommodity)
        .map(d => d.region)
    );
    return Array.from(unique).sort();
  }, [dashboard, selectedCommodity]);

  // Get chart data
  const chartData = useMemo(() => {
    if (!selectedCommodity || !selectedRegion) return [];
    
    const item = dashboard.find(
      d => d.commodity === selectedCommodity && d.region === selectedRegion
    );
    
    if (!item) return [];

    return item.trend.map(t => ({
      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: t.date,
      price: t.price,
      ma7: item.ma_7,
      ma30: item.ma_30
    }));
  }, [dashboard, selectedCommodity, selectedRegion]);

  const selectedItem = useMemo(() => {
    if (!selectedCommodity || !selectedRegion) return null;
    return dashboard.find(
      d => d.commodity === selectedCommodity && d.region === selectedRegion
    );
  }, [dashboard, selectedCommodity, selectedRegion]);

  return (
    <section id="trends" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Price Trends Analysis
          </h2>
          <p className="text-slate-600">
            View historical price trends with moving averages to identify patterns and make informed decisions.
          </p>
        </div>

        {/* Selectors */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Commodity
                </label>
                <Select value={selectedCommodity} onValueChange={(value) => {
                  setSelectedCommodity(value);
                  setSelectedRegion('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select commodity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commodities.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Region
                </label>
                <Select 
                  value={selectedRegion} 
                  onValueChange={setSelectedRegion}
                  disabled={!selectedCommodity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCommodity ? "Select region..." : "Select commodity first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => (
                      <SelectItem key={r} value={r}>{r.split('(')[0].trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        {chartData.length > 0 && selectedItem && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    {selectedItem.commodity} - {selectedItem.region.split('(')[0].trim()}
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Price per {selectedItem.unit} • Last 30 days
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-600"></span>
                    <span className="text-slate-600">Price</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-slate-600">7-day MA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600">30-day MA</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => `₱${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: number) => [`₱${value.toFixed(2)}`, '']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                      dot={false}
                      name="Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ma7" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="7-day MA"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ma30" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="30-day MA"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Price</p>
                  <p className="text-xl font-bold text-slate-900">
                    ₱{selectedItem.latest_price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">7-Day Change</p>
                  <p className={`text-xl font-bold ${
                    (selectedItem['7_day_change_pct'] || 0) > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {selectedItem['7_day_change_pct'] !== null 
                      ? `${selectedItem['7_day_change_pct'] > 0 ? '+' : ''}${selectedItem['7_day_change_pct'].toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">30-Day Change</p>
                  <p className={`text-xl font-bold ${
                    (selectedItem['30_day_change_pct'] || 0) > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {selectedItem['30_day_change_pct'] !== null 
                      ? `${selectedItem['30_day_change_pct'] > 0 ? '+' : ''}${selectedItem['30_day_change_pct'].toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Volatility</p>
                  <p className="text-xl font-bold text-slate-900">
                    {selectedItem.volatility_score}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {chartData.length === 0 && (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              Select a commodity and region to view price trends
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}
