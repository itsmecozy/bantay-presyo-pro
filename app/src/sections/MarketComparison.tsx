import { useState, useEffect, useMemo } from 'react';
import {
  Store, MapPin, Search, TrendingUp, TrendingDown,
  ChevronDown, Info, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MarketCommodity {
  commodity: string;
  specification: string;
  prices: string[];
}

interface MarketCategoryData {
  date: string;
  markets: string[];
  commodities: MarketCommodity[];
}

interface MarketComparisonData {
  regions: Record<string, Record<string, MarketCategoryData>>;
  scrape_metadata?: {
    scraped_at: string;
    source: string;
    regions_with_data: number;
  };
}

function parsePrice(raw: string): number | null {
  if (!raw || raw === "N/A") return null;
  const n = parseFloat(raw.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function getPriceStats(prices: string[]) {
  const nums = prices.map(parsePrice).filter((n): n is number => n !== null);
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const spread = min > 0 ? ((max - min) / min) * 100 : 0;
  return { min, max, avg, spread, count: nums.length };
}

function cellClass(price: string, prices: string[]) {
  const n = parsePrice(price);
  if (n === null) return "text-slate-300 italic";
  const stats = getPriceStats(prices);
  if (!stats) return "text-slate-900";
  if (n === stats.min) return "text-emerald-700 font-semibold bg-emerald-50 rounded px-1";
  if (n === stats.max) return "text-red-600 font-semibold bg-red-50 rounded px-1";
  return "text-slate-800";
}

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}

function StatCard({ title, value, sub, accent }: {
  title: string; value: string; sub: string; accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent ?? "text-slate-900"}`}>{value}</div>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <Store className="h-12 w-12 text-slate-200 mx-auto mb-4" />
      <p className="text-slate-400">{message}</p>
    </Card>
  );
}

export function MarketComparison() {
  const [marketData, setMarketData] = useState<MarketComparisonData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "spread">("name");
  const [showTopSpread, setShowTopSpread] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetch("/data/market_comparison_data.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MarketComparisonData) => {
        setMarketData(data);
        const regions = Object.keys(data.regions);
        if (regions.length > 0) {
          setSelectedRegion(regions[0]);
          const cats = Object.keys(data.regions[regions[0]]);
          if (cats.length > 0) setSelectedCategory(cats[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load market data: ${err.message}`);
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, []);

  const availableRegions = useMemo(() => Object.keys(marketData?.regions ?? {}), [marketData]);

  const availableCategories = useMemo(() => {
    if (!marketData || !selectedRegion) return [];
    return Object.keys(marketData.regions[selectedRegion] ?? {});
  }, [marketData, selectedRegion]);

  const currentData = useMemo(() => {
    if (!marketData || !selectedRegion || !selectedCategory) return null;
    return marketData.regions[selectedRegion]?.[selectedCategory] ?? null;
  }, [marketData, selectedRegion, selectedCategory]);

  const filteredAndSortedCommodities = useMemo(() => {
    if (!currentData) return [];
    let items = currentData.commodities;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (it) => it.commodity.toLowerCase().includes(q) || it.specification.toLowerCase().includes(q)
      );
    }
    if (showTopSpread) {
      items = items.filter((it) => {
        const s = getPriceStats(it.prices);
        return s && s.spread >= 10;
      });
    }
    if (sortBy === "spread") {
      items = [...items].sort((a, b) => {
        const sa = getPriceStats(a.prices)?.spread ?? 0;
        const sb = getPriceStats(b.prices)?.spread ?? 0;
        return sb - sa;
      });
    } else {
      items = [...items].sort((a, b) => a.commodity.localeCompare(b.commodity));
    }
    return items;
  }, [currentData, searchQuery, sortBy, showTopSpread]);

  const summaryStats = useMemo(() => {
    if (!filteredAndSortedCommodities.length || !currentData) return null;
    const allPrices = filteredAndSortedCommodities.flatMap((c) =>
      c.prices.map(parsePrice).filter((n): n is number => n !== null)
    );
    const spreads = filteredAndSortedCommodities
      .map((c) => getPriceStats(c.prices)?.spread ?? 0)
      .filter((s) => s > 0);
    const avgVariation = spreads.length ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;
    const highSpreadCount = filteredAndSortedCommodities.filter((c) => {
      const s = getPriceStats(c.prices);
      return s && s.spread >= 10;
    }).length;
    return {
      markets: currentData.markets.length,
      avgPrice: allPrices.length ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0,
      avgVariation,
      highSpreadCount,
    };
  }, [filteredAndSortedCommodities, currentData]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSearchQuery("");
    const cats = Object.keys(marketData?.regions[region] ?? {});
    setSelectedCategory(cats[0] ?? "");
  };

  const regionShort = selectedRegion.split("(")[0].trim();
  const scrapedAt = marketData?.scrape_metadata?.scraped_at;

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <RefreshCw className="h-10 w-10 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading market price data...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="markets" className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Market Price Comparison</h2>
          </div>
          <p className="text-slate-500 max-w-2xl">
            Side-by-side commodity prices across public markets within each region.
            Green = lowest price, Red = highest price in each row.
          </p>
          {scrapedAt && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Data scraped from DA Bantay Presyo on {new Date(scrapedAt).toLocaleString("en-PH")}
            </p>
          )}
        </div>

        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  <MapPin className="inline h-3 w-3 mr-1" />Region
                </label>
                <Select value={selectedRegion} onValueChange={handleRegionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegions.map((r) => (
                      <SelectItem key={r} value={r}>{r.split("(")[0].trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  <Store className="inline h-3 w-3 mr-1" />Category
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  <Search className="inline h-3 w-3 mr-1" />Search
                </label>
                <Input
                  placeholder="Filter by commodity or spec..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Sort:</span>
              <button
                onClick={() => setSortBy("name")}
                className={`text-xs px-2 py-1 rounded transition-colors ${sortBy === "name" ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >A–Z</button>
              <button
                onClick={() => setSortBy("spread")}
                className={`text-xs px-2 py-1 rounded transition-colors ${sortBy === "spread" ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >Highest Price Spread</button>
              <span className="text-slate-200">|</span>
              <button
                onClick={() => setShowTopSpread(!showTopSpread)}
                className={`text-xs px-2 py-1 rounded transition-colors ${showTopSpread ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >{showTopSpread ? "✓ " : ""}High-Spread Only (≥10%)</button>
            </div>
          </CardContent>
        </Card>

        {!currentData && <EmptyState message="Select a region and category to view market comparison data." />}
        {currentData && filteredAndSortedCommodities.length === 0 && (
          <EmptyState message="No commodities match your search." />
        )}

        {currentData && filteredAndSortedCommodities.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{currentData.markets.length} Markets</Badge>
                <Badge variant="secondary">{filteredAndSortedCommodities.length} Commodities</Badge>
                <span className="text-sm text-slate-400">As of {formatDate(currentData.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />Lowest
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300" />Highest
                </span>
              </div>
            </div>

            <Card className="shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="w-full whitespace-nowrap rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="sticky left-0 z-20 bg-slate-50 min-w-[180px] font-semibold text-slate-700">COMMODITY</TableHead>
                        <TableHead className="min-w-[160px] font-semibold text-slate-700">SPECIFICATIONS</TableHead>
                        {currentData.markets.map((m, i) => (
                          <TableHead key={i} className="text-center min-w-[110px]">
                            <div className="text-[11px] font-semibold text-slate-600 whitespace-normal leading-tight">{m}</div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center bg-green-50/80 min-w-[120px] font-semibold text-slate-700">RANGE / SPREAD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedCommodities.map((item, rowIdx) => {
                        const stats = getPriceStats(item.prices);
                        return (
                          <TableRow key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="sticky left-0 z-10 bg-white font-medium text-slate-900 border-r border-slate-100">{item.commodity}</TableCell>
                            <TableCell className="text-sm text-slate-500">{item.specification || "—"}</TableCell>
                            {item.prices.map((price, colIdx) => (
                              <TableCell key={colIdx} className="text-center py-2">
                                {price === "N/A" ? (
                                  <span className="text-slate-300 text-sm">—</span>
                                ) : (
                                  <span className={`text-sm ${cellClass(price, item.prices)}`}>₱{price}</span>
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="text-center bg-green-50/40">
                              {stats ? (
                                <div className="text-xs space-y-0.5">
                                  <div>
                                    <span className="text-emerald-700 font-semibold">₱{stats.min.toFixed(2)}</span>
                                    <span className="text-slate-300 mx-1">–</span>
                                    <span className="text-red-600 font-semibold">₱{stats.max.toFixed(2)}</span>
                                  </div>
                                  {stats.spread > 0 && (
                                    <div className={`font-medium ${stats.spread >= 10 ? "text-amber-600" : "text-slate-400"}`}>
                                      {stats.spread.toFixed(1)}% spread
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>

            {summaryStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard title="Markets Covered" value={`${summaryStats.markets}`} sub={`Public markets in ${regionShort}`} />
                <StatCard title="Avg Price" value={`₱${summaryStats.avgPrice.toFixed(2)}`} sub="Across all commodities & markets" />
                <StatCard
                  title="Avg Price Spread"
                  value={`${summaryStats.avgVariation.toFixed(1)}%`}
                  sub="Min–max gap between markets"
                  accent={summaryStats.avgVariation > 10 ? "text-amber-600" : "text-emerald-700"}
                />
                <StatCard
                  title="High-Spread Items"
                  value={`${summaryStats.highSpreadCount}`}
                  sub="Commodities with ≥10% price spread"
                  accent={summaryStats.highSpreadCount > 0 ? "text-red-600" : "text-slate-900"}
                />
              </div>
            )}

            <details className="mt-4">
              <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                View all {currentData.markets.length} markets in this table
              </summary>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-4">
                {currentData.markets.map((m, i) => (
                  <div key={i} className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-4 h-4 bg-slate-100 rounded-full text-center text-[10px] leading-4 font-medium text-slate-600">{i + 1}</span>
                    {m}
                  </div>
                ))}
              </div>
            </details>
          </>
        )}

        <p className="mt-8 text-xs text-slate-400 text-center">
          Source: Philippine Department of Agriculture — Bantay Presyo (
          <a href="http://www.bantaypresyo.da.gov.ph/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-600">
            bantaypresyo.da.gov.ph
          </a>
          ). Prices are monitored retail prices at public markets.
        </p>
      </div>
    </section>
  );
}
