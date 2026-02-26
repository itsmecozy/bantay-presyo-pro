import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { categories, regions, type Category, categoryIcons } from '@/types';
import type { DashboardItem } from '@/types';
import { useFilteredDashboard } from '@/hooks/useData';

interface PriceExplorerProps {
  dashboard: DashboardItem[];
  selectedRegion: string;
  selectedCategory: string;
  onRegionChange: (region: string) => void;
  onCategoryChange: (category: string) => void;
}

export function PriceExplorer({
  dashboard,
  selectedRegion,
  selectedCategory,
  onRegionChange,
  onCategoryChange
}: PriceExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useFilteredDashboard(dashboard, {
    region: selectedRegion,
    category: selectedCategory,
    search: searchQuery
  });

  const getVolatilityColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'moderate': return 'bg-amber-100 text-amber-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'very high': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-slate-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return 'text-slate-400';
    if (change > 0) return 'text-red-500';
    if (change < 0) return 'text-green-500';
    return 'text-slate-500';
  };

  // Mini sparkline component
  const Sparkline = ({ data }: { data: { date: string; price: number }[] }) => {
    if (!data || data.length < 2) return <div className="w-20 h-8 bg-slate-100 rounded" />;
    
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    
    const points = prices.map((price, i) => {
      const x = (i / (prices.length - 1)) * 80;
      const y = 28 - ((price - min) / range) * 24;
      return `${x},${y}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] >= prices[0];
    
    return (
      <svg width="80" height="32" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={isUp ? '#ef4444' : '#22c55e'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <section id="explorer" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Regional Price Explorer
          </h2>
          <p className="text-slate-600">
            Search and filter commodity prices across all regions. View trends and volatility indicators.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search commodities or regions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={selectedRegion} onValueChange={onRegionChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Regions">All Regions</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region.split('(')[0].trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Categories">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {categoryIcons[cat]} {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedRegion !== 'All Regions' || selectedCategory !== 'All Categories' || searchQuery) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-500">Active filters:</span>
                {selectedRegion !== 'All Regions' && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedRegion.split('(')[0].trim()}
                    <button onClick={() => onRegionChange('All Regions')} className="ml-1">×</button>
                  </Badge>
                )}
                {selectedCategory !== 'All Categories' && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryIcons[selectedCategory as Category]} {selectedCategory}
                    <button onClick={() => onCategoryChange('All Categories')} className="ml-1">×</button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="ml-1">×</button>
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    onRegionChange('All Regions');
                    onCategoryChange('All Categories');
                    setSearchQuery('');
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-500">
          Showing {filteredData.length} of {dashboard.length} records
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Price (₱)</TableHead>
                    <TableHead className="text-right">7-Day</TableHead>
                    <TableHead className="text-right">30-Day</TableHead>
                    <TableHead>Volatility</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 50).map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{categoryIcons[item.category as Category]}</span>
                          <div>
                            <div className="font-medium text-slate-900">{item.commodity}</div>
                            <div className="text-xs text-slate-500">per {item.unit}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {item.region.split('(')[0].trim()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.latest_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getChangeIcon(item['7_day_change_pct'])}
                          <span className={getChangeColor(item['7_day_change_pct'])}>
                            {item['7_day_change_pct'] !== null 
                              ? `${item['7_day_change_pct'] > 0 ? '+' : ''}${item['7_day_change_pct'].toFixed(1)}%`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getChangeIcon(item['30_day_change_pct'])}
                          <span className={getChangeColor(item['30_day_change_pct'])}>
                            {item['30_day_change_pct'] !== null 
                              ? `${item['30_day_change_pct'] > 0 ? '+' : ''}${item['30_day_change_pct'].toFixed(1)}%`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getVolatilityColor(item.volatility_score)}>
                          {item.volatility_score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Sparkline data={item.trend.slice(-14)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredData.length > 50 && (
              <div className="p-4 text-center text-sm text-slate-500 border-t">
                Showing first 50 results. Use filters to narrow down.
              </div>
            )}
            
            {filteredData.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No results found. Try adjusting your filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
