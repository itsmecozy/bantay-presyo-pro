import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardItem } from '@/types';

interface VolatilityAnalysisProps {
  dashboard: DashboardItem[];
}

export function VolatilityAnalysis({ dashboard }: VolatilityAnalysisProps) {
  // Calculate volatility distribution
  const volatilityStats = useMemo(() => {
    const distribution: Record<string, number> = {
      'Low': 0,
      'Moderate': 0,
      'High': 0,
      'Very High': 0,
      'Insufficient Data': 0
    };

    dashboard.forEach(item => {
      distribution[item.volatility_score]++;
    });

    return distribution;
  }, [dashboard]);

  // Get most and least volatile items
  const mostVolatile = useMemo(() => {
    return dashboard
      .filter(d => d.volatility_value !== null)
      .sort((a, b) => (b.volatility_value || 0) - (a.volatility_value || 0))
      .slice(0, 10);
  }, [dashboard]);

  const leastVolatile = useMemo(() => {
    return dashboard
      .filter(d => d.volatility_value !== null)
      .sort((a, b) => (a.volatility_value || 0) - (b.volatility_value || 0))
      .slice(0, 10);
  }, [dashboard]);

  const getVolatilityColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      case 'moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'very high': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getVolatilityIcon = (score: string) => {
    switch (score.toLowerCase()) {
      case 'low': return <Shield className="h-4 w-4" />;
      case 'moderate': return <TrendingUp className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'very high': return <AlertTriangle className="h-4 w-4" />;
      default: return <TrendingDown className="h-4 w-4" />;
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Volatility Analysis
          </h2>
          <p className="text-slate-600">
            Understand price stability across commodities and regions. Identify high-risk and stable markets.
          </p>
        </div>

        {/* Volatility Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(volatilityStats).map(([score, count]) => (
            <Card key={score} className={`border-2 ${getVolatilityColor(score)}`}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  {getVolatilityIcon(score)}
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm font-medium">{score}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Volatile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Most Volatile Commodities</CardTitle>
              </div>
              <p className="text-sm text-slate-500">
                Highest price fluctuations in the last 30 days
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Commodity</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Region</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">Volatility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostVolatile.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{item.commodity}</div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.region.split('(')[0].trim()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className={getVolatilityColor(item.volatility_score)}>
                            {item.volatility_value?.toFixed(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Most Stable */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Most Stable Commodities</CardTitle>
              </div>
              <p className="text-sm text-slate-500">
                Lowest price fluctuations in the last 30 days
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Commodity</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Region</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">Volatility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leastVolatile.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{item.commodity}</div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.region.split('(')[0].trim()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className={getVolatilityColor(item.volatility_score)}>
                            {item.volatility_value?.toFixed(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volatility Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Volatility Score Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Low</span>
                </div>
                <p className="text-sm text-green-700">
                  Coefficient of variation &lt; 2%. Very stable prices with minimal fluctuations.
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-900">Moderate</span>
                </div>
                <p className="text-sm text-amber-700">
                  CV between 2-5%. Normal price variations expected in agricultural markets.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-900">High</span>
                </div>
                <p className="text-sm text-orange-700">
                  CV between 5-10%. Significant price fluctuations. Monitor closely.
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">Very High</span>
                </div>
                <p className="text-sm text-red-700">
                  CV &gt; 10%. Extreme volatility. High risk for both buyers and sellers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
