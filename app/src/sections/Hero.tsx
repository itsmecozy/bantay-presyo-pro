import { TrendingUp, MapPin, ShoppingCart, Calendar } from 'lucide-react';
import type { SummaryStats } from '@/types';

interface HeroProps {
  summary: SummaryStats | null;
}

export function Hero({ summary }: HeroProps) {
  const stats = [
    {
      icon: ShoppingCart,
      value: summary?.metadata.commodities_count || 24,
      label: 'Commodities Monitored',
      color: 'bg-blue-500'
    },
    {
      icon: MapPin,
      value: summary?.metadata.regions_count || 17,
      label: 'Regions Covered',
      color: 'bg-green-500'
    },
    {
      icon: TrendingUp,
      value: 132,
      label: 'Markets Tracked',
      color: 'bg-amber-500'
    },
    {
      icon: Calendar,
      value: 'Daily',
      label: 'Price Updates',
      color: 'bg-purple-500'
    }
  ];

  return (
    <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 text-white py-16 lg:py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Philippine Commodity
            <span className="block text-green-200">Price Monitor</span>
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
            Real-time agricultural price tracking across 17 regions. 
            Monitor rice, meat, fish, vegetables, and fruits with advanced analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors"
            >
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-green-100">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Data Source Badge */}
        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Data Source: Department of Agriculture - Bantay Presyo
          </span>
        </div>
      </div>
    </section>
  );
}

