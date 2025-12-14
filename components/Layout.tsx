import React from 'react';
import { Zap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-energy-500/10 rounded-lg">
                <Zap className="h-6 w-6 text-energy-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">EnergyScout</h1>
                <p className="text-xs text-slate-400">Metering Intelligence Agent</p>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Powered by Gemini 2.5
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-800 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} EnergyScout. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
