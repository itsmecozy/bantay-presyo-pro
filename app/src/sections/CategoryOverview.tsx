import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { categories, categoryIcons } from '@/types';
import type { DashboardItem } from '@/types';
import { useCategoryStats } from '@/hooks/useData';

interface CategoryOverviewProps {
  dashboard: DashboardItem[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryOverview({ 
  dashboard, 
  selectedCategory, 
  onCategoryChange 
}: CategoryOverviewProps) {
  const stats = useCategoryStats(dashboard);

  const getPriceRange = (category: string) => {
    const items = dashboard.filter(d => d.category === category);
    if (items.length === 0) return 'N/A';
    const prices = items.map(i => i.latest_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `₱${min.toFixed(0)} - ₱${max.toFixed(0)}`;
  };

  return (
    <section id="overview" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Price Overview by Category
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Click on a category to filter the data and explore prices across different commodity types.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const stat = stats[category];
            const isSelected = selectedCategory === category;
            const change7d = stat?.avgChange7d || 0;

            return (
              <Card
                key={category}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-green-500 shadow-lg' 
                    : 'hover:-translate-y-1'
                }`}
                onClick={() => onCategoryChange(isSelected ? 'All Categories' : category)}
              >
                <CardContent className="p-5">
                  <div className="text-3xl mb-3">{categoryIcons[category]}</div>
                  <h3 className="font-semibold text-slate-900 mb-1">{category}</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {stat?.count || 0} items
                  </p>
                  
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500 mb-1">Price Range</p>
                    <p className="font-medium text-slate-900">
                      {getPriceRange(category)}
                    </p>
                  </div>

                  {change7d !== 0 && (
                    <div className="mt-3 flex items-center gap-1">
                      {change7d > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : change7d < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        change7d > 0 ? 'text-red-500' : change7d < 0 ? 'text-green-500' : 'text-slate-500'
                      }`}>
                        {change7d > 0 ? '+' : ''}{change7d.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">7d</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedCategory !== 'All Categories' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => onCategoryChange('All Categories')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear filter →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
