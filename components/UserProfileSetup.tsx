import React, { useState } from 'react';
import { Key, User, ShieldCheck, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
  existingProfile?: UserProfile | null;
  onCancel?: () => void;
}

export const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ onComplete, existingProfile, onCancel }) => {
  const [name, setName] = useState(existingProfile?.name || '');
  const [apiKey, setApiKey] = useState(existingProfile?.apiKey || '');
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && apiKey) {
      onComplete({ name, apiKey });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-800/50 p-6 text-center border-b border-slate-800">
          <div className="w-16 h-16 bg-energy-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-energy-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {existingProfile ? 'Update Settings' : 'Welcome to EnergyScout'}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {existingProfile ? 'Modify your agent configuration' : 'Connect your Gemini account to get started.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-energy-500 outline-none transition-all"
                />
                <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Gemini API Key</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzbSy..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-energy-500 outline-none transition-all"
                />
                <Key className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Your key is stored locally in your browser and used only to communicate with Google's API.
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-energy-400 hover:text-energy-300 ml-1">Get a key here.</a>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!name || !apiKey}
              className="flex-1 py-3 px-4 bg-energy-600 hover:bg-energy-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-energy-900/20 transition-all flex items-center justify-center gap-2"
            >
              {existingProfile ? 'Save Changes' : 'Start Scouting'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};