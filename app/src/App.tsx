import { useState } from 'react';
import { Header } from '@/sections/Header';
import { Hero } from '@/sections/Hero';
import { CategoryOverview } from '@/sections/CategoryOverview';
import { PriceExplorer } from '@/sections/PriceExplorer';
import { CommodityComparison } from '@/sections/CommodityComparison';
import { PriceTrends } from '@/sections/PriceTrends';
import { RegionalRankings } from '@/sections/RegionalRankings';
import { VolatilityAnalysis } from '@/sections/VolatilityAnalysis';
import { MarketComparison } from '@/sections/MarketComparison';
import { Footer } from '@/sections/Footer';
import { useData } from '@/hooks/useData';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const { dashboard, comparison, summary, loading, error } = useData();
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading commodity price data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
      />
      
      <main>
        <Hero summary={summary} />
        
        <CategoryOverview 
          dashboard={dashboard}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        <PriceExplorer 
          dashboard={dashboard}
          selectedRegion={selectedRegion}
          selectedCategory={selectedCategory}
          onRegionChange={setSelectedRegion}
          onCategoryChange={setSelectedCategory}
        />
        
        <MarketComparison />
        
        <CommodityComparison 
          comparison={comparison}
          selectedCommodity={selectedCommodity}
          onCommodityChange={setSelectedCommodity}
        />
        
        <PriceTrends 
          dashboard={dashboard}
        />
        
        <RegionalRankings 
          dashboard={dashboard}
        />
        
        <VolatilityAnalysis 
          dashboard={dashboard}
        />
      </main>
      
      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
