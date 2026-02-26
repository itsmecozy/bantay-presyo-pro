import { useState, useMemo } from 'react';
import { Medal, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { DashboardItem } from '@/types';

interface RegionalRankingsProps {
  dashboard: DashboardItem[];
}

export function RegionalRankings({ dashboard }: RegionalRankingsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Rice');

  // Calculate regional averages for selected category
  const regionalData = useMemo(() => {
    const regionMap: Record<string, {
      region: string;
      totalPrice: number;
      count: number;
      commodities: string[];
    }> = {};

    dashboard
      .filter(d => d.category === selectedCategory)
      .forEach(d => {
        if (!regionMap[d.region]) {
          regionMap[d.region] = {
            region: d.region,
            totalPrice: 0,
            count: 0,
            commodities: []
          };
        }
        regionMap[d.region].totalPrice += d.latest_price;
        regionMap[d.region].count++;
        regionMap[d.region].commodities.push(d.commodity);
      });

    const regions = Object.values(regionMap).map(r => ({
      ...r,
      avgPrice: r.totalPrice / r.count
    }));

    return regions.sort((a, b) => a.avgPrice - b.avgPrice);
  }, [dashboard, selectedCategory]);

  const nationalAverage = useMemo(() => {
    if (regionalData.length === 0) return 0;
    const total = regionalData.reduce((sum, r) => sum + r.avgPrice, 0);
    return total / regionalData.length;
  }, [regionalData]);

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-slate-400';
    if (index === 2) return 'text-amber-600';
    return 'text-slate-300';
  };

  const categories = ['Rice', 'Meat', 'Fish', 'Vegetables', 'Fruits'];

  return (
    <section id="rankings" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Regional Rankings
          </h2>
          <p className="text-slate-600">
            Compare average prices across regions. Find the cheapest and most expensive markets.
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rankings List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedCategory} - Regional Price Ranking
              </CardTitle>
              <p className="text-sm text-slate-500">
                Sorted by average price (cheapest to most expensive)
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Region</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">Avg Price</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">vs National</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalData.map((region, index) => {
                      const vsNational = ((region.avgPrice - nationalAverage) / nationalAverage) * 100;
                      
                      return (
                        <tr 
                          key={region.region} 
                          className="border-b hover:bg-slate-50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
                              <span className="font-medium">{index + 1}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-slate-900">
                                {region.region.split('(')[0].trim()}
                              </span>
                              {index === 0 && (
                                <Badge className="bg-green-100 text-green-700">Cheapest</Badge>
                              )}
                              {index === regionalData.length - 1 && (
                                <Badge className="bg-red-100 text-red-700">Most Expensive</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            ₱{region.avgPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {vsNational > 0 ? (
                                <TrendingUp className="h-4 w-4 text-red-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-green-500" />
                              )}
                              <span className={vsNational > 0 ? 'text-red-500' : 'text-green-500'}>
                                {vsNational > 0 ? '+' : ''}{vsNational.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Cheapest Region</p>
                  <p className="font-semibold text-green-900">
                    {regionalData[0]?.region.split('(')[0].trim() || 'N/A'}
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    ₱{regionalData[0]?.avgPrice.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 mb-1">Most Expensive Region</p>
                  <p className="font-semibold text-red-900">
                    {regionalData[regionalData.length - 1]?.region.split('(')[0].trim() || 'N/A'}
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    ₱{regionalData[regionalData.length - 1]?.avgPrice.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">National Average</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ₱{nationalAverage.toFixed(2)}
                  </p>
                </div>

                {regionalData.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-700 mb-1">Price Gap</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {((regionalData[regionalData.length - 1].avgPrice - regionalData[0].avgPrice) / regionalData[0].avgPrice * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Difference between cheapest and most expensive
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 5 Cheapest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {regionalData.slice(0, 5).map((region, index) => (
                    <div 
                      key={region.region}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm text-slate-700">
                          {region.region.split('(')[0].trim()}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        ₱{region.avgPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
