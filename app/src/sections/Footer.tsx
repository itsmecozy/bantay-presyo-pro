import { Leaf, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Bantay Presyo</h3>
                <span className="text-xs text-green-400">Pro</span>
              </div>
            </div>
            <p className="text-slate-400 mb-4 max-w-md">
              An upgraded commodity price monitoring system for the Philippines. 
              Track agricultural prices across 17 regions with advanced analytics 
              and real-time data.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Data updated daily</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#overview" className="hover:text-green-400 transition-colors">
                  Price Overview
                </a>
              </li>
              <li>
                <a href="#explorer" className="hover:text-green-400 transition-colors">
                  Price Explorer
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-green-400 transition-colors">
                  Commodity Comparison
                </a>
              </li>
              <li>
                <a href="#trends" className="hover:text-green-400 transition-colors">
                  Price Trends
                </a>
              </li>
              <li>
                <a href="#rankings" className="hover:text-green-400 transition-colors">
                  Regional Rankings
                </a>
              </li>
            </ul>
          </div>

          {/* Official Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Official Sources</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="http://www.bantaypresyo.da.gov.ph/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors flex items-center gap-1"
                >
                  DA Bantay Presyo
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.da.gov.ph/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors flex items-center gap-1"
                >
                  Department of Agriculture
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://openstat.psa.gov.ph/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors flex items-center gap-1"
                >
                  PSA OpenSTAT
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              <p>Data Source: Department of Agriculture - Bantay Presyo</p>
              <p className="mt-1">
                Disclaimer: This is a demonstration application. Prices are for reference only.
                Please verify with official DA sources for actual market transactions.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              <p>© 2026 Bantay Presyo Pro. All rights reserved.</p>
              <p className="mt-1">Generated: February 22, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
