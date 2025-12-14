import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, Bot, MessageCircle, Send, Mail } from 'lucide-react';
import { NewsReport } from '../types';

interface ResultsFeedProps {
  report: NewsReport;
  onDraftEmail: () => void;
  onShareWhatsApp: () => void;
  isDrafting: boolean;
  defaultPhone?: string;
}

export const ResultsFeed: React.FC<ResultsFeedProps> = ({ 
  report, 
  onDraftEmail, 
  onShareWhatsApp,
  isDrafting,
  defaultPhone = '',
}) => {
  const [waNumber, setWaNumber] = useState(defaultPhone);

  useEffect(() => {
    if (defaultPhone) setWaNumber(defaultPhone);
  }, [defaultPhone]);

  // Pass current number back up if needed, but for now we just handle the click
  // Ideally, the parent should handle the actual open logic if we want to fully separate concerns,
  // but for the manual input box in the sidebar, we can keep some local state or lift it.
  // To keep it simple and compatible with the "Auto-Pilot", we will treat the sidebar button
  // as a manual override that uses the local input.

  const handleManualWhatsApp = () => {
    // This duplicates logic in App.tsx slightly but allows for the manual input override
    const cleanNumber = waNumber.replace(/[^0-9]/g, '');
    const sourceList = report.sources.map(s => `• ${s.title}: ${s.uri}`).join('\n');
    const message = `*EnergyScout Update - Sources:*\n\n${sourceList}`;
    const encodedMessage = encodeURIComponent(message);
    const url = cleanNumber 
      ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('##') || line.startsWith('**') && line.length < 50) {
        return <h3 key={i} dir="auto" className="text-lg font-semibold text-energy-100 mt-6 mb-2">{line.replace(/\*\*/g, '').replace(/##/g, '')}</h3>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={i} dir="auto" className="ml-4 mb-2 text-slate-300 pl-1">{line.replace(/^[*|-]\s/, '')}</li>;
      }
      return <p key={i} dir="auto" className="mb-3 text-slate-300 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-energy-500" />
              AI Research Report
            </h3>
            <span className="text-sm text-slate-400">
              {report.timestamp.toLocaleDateString()} {report.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="prose prose-invert max-w-none">
            {renderText(report.rawText)}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end gap-3">
             {/* Mobile/Quick Actions */}
             <button
              onClick={onDraftEmail}
              disabled={isDrafting}
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-200 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-white/5 disabled:opacity-50"
            >
              {isDrafting ? (
                <>Loading...</>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Draft Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Sources */}
      <div className="space-y-6">
        {/* WhatsApp Share Card */}
        <div className={`
          border rounded-2xl p-6 transition-all
          ${defaultPhone ? 'bg-[#25D366]/20 border-[#25D366] shadow-[0_0_20px_rgba(37,211,102,0.1)]' : 'bg-[#25D366]/10 border-[#25D366]/20'}
        `}>
          <h4 className="text-sm font-semibold text-[#25D366] uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Share Sources
          </h4>
          <p className="text-xs text-slate-400 mb-3">
             Send list of links via WhatsApp.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="201xxxxxxxxx"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#25D366]"
            />
            <button 
              onClick={handleManualWhatsApp}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-2 rounded-lg transition-colors"
              title="Send via WhatsApp"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sources List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Cited Sources
          </h4>
          
          <div className="space-y-3">
            {report.sources.length === 0 && (
              <p className="text-sm text-slate-500 italic">No direct sources linked.</p>
            )}
            {report.sources.map((source, index) => (
              <a
                key={index}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                dir="auto"
                className="block group p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-energy-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-slate-200 group-hover:text-energy-400 line-clamp-2">
                    {source.title}
                  </span>
                  <ExternalLink className="h-3 w-3 text-slate-500 flex-shrink-0 mt-1" />
                </div>
                <div className="mt-1 text-xs text-slate-600 truncate">
                  {new URL(source.uri).hostname}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};