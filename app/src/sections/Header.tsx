import { Leaf, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { regions } from '@/types';

interface HeaderProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

export function Header({ selectedRegion, onRegionChange }: HeaderProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/data/commodity_prices_latest.csv';
    link.download = 'bantay_presyo_latest.csv';
    link.click();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Bantay Presyo
              </h1>
              <span className="text-xs text-green-600 font-medium">Pro</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#overview" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
              Overview
            </a>
            <a href="#explorer" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
              Explorer
            </a>
            <a href="#markets" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
              Markets
            </a>
            <a href="#comparison" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
              Comparison
            </a>
            <a href="#trends" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
              Trends
            </a>
            <a href="#rankings" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
              Rankings
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>As of Feb 22, 2026</span>
            </div>
            
            <Select value={selectedRegion} onValueChange={onRegionChange}>
              <SelectTrigger className="w-[180px] hidden lg:flex">
                <SelectValue placeholder="Select Region" />
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

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
