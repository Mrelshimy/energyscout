import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { AppStatus } from '../types';

interface SearchControlsProps {
  onSearch: (query: string) => void;
  status: AppStatus;
}

export const SearchControls: React.FC<SearchControlsProps> = ({ onSearch, status }) => {
  const [query, setQuery] = useState("electricity meters Egypt, العدادات الذكية, EEHC updates");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const isLoading = status === AppStatus.SEARCHING;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8 shadow-xl">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-white mb-2">Discovery Engine</h2>
        <p className="text-slate-400 mb-6">
          Scrape the latest web news for updates on electricity meters, focusing on Egypt and global trends.
        </p>
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              dir="auto"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-40 focus:ring-2 focus:ring-energy-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
              placeholder="Enter keywords (e.g., Egypt Smart Meters)..."
            />
            <Search className="absolute left-4 h-5 w-5 text-slate-500" />
            
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 bg-energy-600 hover:bg-energy-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Start Scan'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
          <span className="text-slate-400">Suggested:</span>
          <button onClick={() => setQuery("عدادات الكهرباء مصر")} className="hover:text-energy-400 transition-colors">Egypt Meters (Arabic)</button>
          <span className="w-1 h-1 bg-slate-700 rounded-full self-center"></span>
          <button onClick={() => setQuery("prepaid meters Egypt updates")} className="hover:text-energy-400 transition-colors">Prepaid Updates</button>
          <span className="w-1 h-1 bg-slate-700 rounded-full self-center"></span>
          <button onClick={() => setQuery("smart grid AMI technology")} className="hover:text-energy-400 transition-colors">Global AMI Tech</button>
        </div>
      </div>
    </div>
  );
};