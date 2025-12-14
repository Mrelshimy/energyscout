import React, { useState, useEffect } from 'react';
import { Settings, Play, CheckCircle, Clock, Save, Bell, Zap, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { DailyConfig } from '../types';

interface DailyAutomationProps {
  config: DailyConfig | null;
  onSaveConfig: (config: DailyConfig) => void;
  onRunDaily: (topic: string) => void;
  isLoading: boolean;
}

export const DailyAutomation: React.FC<DailyAutomationProps> = ({ 
  config, 
  onSaveConfig, 
  onRunDaily,
  isLoading 
}) => {
  const [isEditing, setIsEditing] = useState(!config);
  const [topic, setTopic] = useState(config?.topic || '');
  const [phone, setPhone] = useState(config?.phoneNumber || '');
  const [autoRun, setAutoRun] = useState(config?.autoRun || false);
  const [scheduledTime, setScheduledTime] = useState(config?.scheduledTime || '09:00');
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>(config?.channel || 'EMAIL');
  const [nextRunText, setNextRunText] = useState('');

  // Update countdown text
  useEffect(() => {
    if (!config?.autoRun || !config?.scheduledTime) {
      setNextRunText('');
      return;
    }

    const updateCountdown = () => {
      if (isDue()) {
        setNextRunText('Due now');
        return;
      }
      const now = new Date();
      const [hours, minutes] = config.scheduledTime.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      
      if (target <= now) {
        // Target is tomorrow
        target.setDate(target.getDate() + 1);
      }
      
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setNextRunText(`Next run in ${h}h ${m}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      topic,
      phoneNumber: phone,
      lastRun: config?.lastRun || null,
      autoRun,
      channel,
      scheduledTime
    });
    setIsEditing(false);
  };

  const isDue = () => {
    if (!config?.lastRun) return true;
    const last = new Date(config.lastRun);
    const now = new Date();
    // Reset "Done" status if it's a new day
    return last.getDate() !== now.getDate() || last.getMonth() !== now.getMonth();
  };

  const testPopup = () => {
    const win = window.open('', '_blank', 'width=100,height=100');
    if (win) {
      win.close();
      alert("Success! Popups are allowed.");
    } else {
      alert("Popup blocked! Please allow popups for this site so automation can work.");
    }
  };

  if (isEditing) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8 shadow-xl animate-fade-in">
        <div className="flex items-center gap-2 mb-4 text-energy-400">
          <Settings className="h-5 w-5" />
          <h2 className="font-semibold text-white">Automation Configuration</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Daily Search Topic</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Smart Meters Egypt"
              dir="auto"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-energy-500 outline-none"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Preferred Channel</label>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${channel === 'EMAIL' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Mail className="h-4 w-4" /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${channel === 'WHATSAPP' ? 'bg-[#25D366]/20 text-[#25D366] shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Recipient Number (Optional for Email)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="201xxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-energy-500 outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
             <div className="flex items-center gap-3">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoRun} 
                    onChange={(e) => setAutoRun(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-energy-600"></div>
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">Enable Scheduled Dashboard</span>
                  <span className="text-xs text-slate-400 block">App will run automatically at the time below.</span>
                </div>
            </div>

            {autoRun && (
              <div className="pl-14 animate-fade-in space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Daily Run Time</label>
                  <input 
                    type="time" 
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-3 py-1 text-sm focus:border-energy-500 outline-none"
                  />
                </div>
                <div className="text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded flex gap-2">
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  <p>
                    Important: You must allow popups for this site for automation to open WhatsApp/Email without clicking.
                    <button onClick={testPopup} className="underline ml-1 hover:text-amber-400 font-bold">
                       Test Permissions
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {config && (
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-energy-600 hover:bg-energy-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 text-slate-500 hover:text-white bg-slate-800/50 rounded-full"
          title="Edit Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            {config?.autoRun ? <Zap className="h-5 w-5 text-yellow-400" /> : <Bell className="h-5 w-5 text-energy-500" />}
            {config?.autoRun ? 'Dashboard Scheduler Active' : 'Daily Routine (Manual)'}
          </h2>
          <div className="flex flex-col gap-1 mt-1">
             <p className="text-slate-400 text-sm">
              Topic: <span className="text-slate-200 font-medium">{config?.topic}</span>
            </p>
            {config?.autoRun && (
              <p className="text-slate-400 text-sm">
                Schedule: <span className="text-slate-200 font-medium">{config.scheduledTime}</span>
                {nextRunText && <span className="text-energy-400 ml-2 text-xs">({nextRunText})</span>}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-xs">
            {isDue() ? (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                <Clock className="h-3 w-3" /> Due today
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded">
                <CheckCircle className="h-3 w-3" /> Done for today
              </span>
            )}
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-400">
               via {config?.channel === 'EMAIL' ? <Mail className="h-3 w-3"/> : <MessageCircle className="h-3 w-3"/>}
            </span>
          </div>
        </div>

        <button
          onClick={() => config && onRunDaily(config.topic)}
          disabled={isLoading}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all shadow-lg
            ${isDue() 
              ? 'bg-energy-600 hover:bg-energy-500 text-white shadow-energy-900/20' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              <Play className={`h-5 w-5 ${isDue() ? 'fill-current' : ''}`} />
              Run Now
            </>
          )}
        </button>
      </div>
    </div>
  );
};