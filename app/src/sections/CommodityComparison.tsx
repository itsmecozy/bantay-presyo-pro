import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { CommodityComparison } from '@/types';

interface CommodityComparisonProps {
  comparison: Record<string, CommodityComparison>;
  selectedCommodity: string;
  onCommodityChange: (commodity: string) => void;
}

export function CommodityComparison({
  comparison,
  selectedCommodity,
  onCommodityChange
}: CommodityComparisonProps) {
  const commodities = useMemo(() => Object.keys(comparison).sort(), [comparison]);
  
  const selectedData = selectedCommodity ? comparison[selectedCommodity] : null;

  const getChangeColor = (change: number | null) => {
    if (change === null) return 'text-slate-400';
    if (change > 0) return 'text-red-500';
    if (change < 0) return 'text-green-500';
    return 'text-slate-500';
  };

  return (
    <section id="comparison" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Commodity Comparison
          </h2>
          <p className="text-slate-600">
            Compare prices across regions and identify the cheapest and most expensive markets.
          </p>
        </div>

        {/* Commodity Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="text-sm font-medium text-slate-700">Select Commodity:</span>
              <Select value={selectedCommodity} onValueChange={onCommodityChange}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Choose a commodity..." />
                </SelectTrigger>
                <SelectContent>
                  {commodities.map(commodity => (
                    <SelectItem key={commodity} value={commodity}>
                      {commodity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedData && (
          <>
            {/* National Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 mb-1">National Average</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₱{selectedData.national_stats.avg_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">per {selectedData.unit}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 mb-1">Lowest Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₱{selectedData.national_stats.min_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">per {selectedData.unit}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 mb-1">Highest Price</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₱{selectedData.national_stats.max_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">per {selectedData.unit}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 mb-1">Price Gap</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {selectedData.national_stats.price_gap_pct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">between regions</p>
                </CardContent>
              </Card>
            </div>

            {/* Regional Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regional Price Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Rank</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Region</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Price (₱)</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">vs Avg</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">7-Day</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-700">Volatility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedData.regional_trends.map((region, index) => {
                        const vsAvg = ((region.latest_price - selectedData.national_stats.avg_price) / selectedData.national_stats.avg_price) * 100;
                        const isCheapest = index === 0;
                        const isMostExpensive = index === selectedData.regional_trends.length - 1;
                        
                        return (
                          <tr 
                            key={region.region} 
                            className={`border-b hover:bg-slate-50 ${
                              isCheapest ? 'bg-green-50/50' : isMostExpensive ? 'bg-red-50/50' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              {index < 3 ? (
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  index === 1 ? 'bg-slate-200 text-slate-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {index + 1}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-sm">{index + 1}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span className="font-medium text-slate-900">
                                  {region.region.split('(')[0].trim()}
                                </span>
                                {isCheapest && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">Cheapest</Badge>
                                )}
                                {isMostExpensive && (
                                  <Badge className="bg-red-100 text-red-700 text-xs">Most Expensive</Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              ₱{region.latest_price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={vsAvg > 0 ? 'text-red-500' : vsAvg < 0 ? 'text-green-500' : 'text-slate-500'}>
                                {vsAvg > 0 ? '+' : ''}{vsAvg.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={getChangeColor(region['7_day_change_pct'])}>
                                {region['7_day_change_pct'] !== null 
                                  ? `${region['7_day_change_pct'] > 0 ? '+' : ''}${region['7_day_change_pct'].toFixed(1)}%`
                                  : 'N/A'
                                }
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={
                                region.volatility_score === 'Low' ? 'bg-green-100 text-green-700' :
                                region.volatility_score === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                                region.volatility_score === 'High' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }>
                                {region.volatility_score}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Stability Ranking */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Price Stability Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Regions ranked by price volatility (most stable to least stable)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedData.stability_ranking.slice(0, 10).map((item) => (
                    <div 
                      key={item.region}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-slate-500">#{item.rank}</span>
                      <span className="text-sm text-slate-900">{item.region.split('(')[0].trim()}</span>
                      <Badge className={
                        item.volatility_score === 'Low' ? 'bg-green-100 text-green-700' :
                        item.volatility_score === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                        item.volatility_score === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {item.volatility_score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedData && (
          <Card className="p-12 text-center">
            <p className="text-slate-500">
              Select a commodity above to view regional price comparison
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}
