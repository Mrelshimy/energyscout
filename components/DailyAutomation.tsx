import React, { useState, useEffect } from 'react';
import { Settings, Play, CheckCircle, Clock, Save, Bell, Zap, Mail, MessageCircle, ExternalLink, RefreshCw, Send } from 'lucide-react';
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
  const [email, setEmail] = useState(config?.emailAddress || '');
  const [autoRun, setAutoRun] = useState(config?.autoRun || false);
  const [scheduledTime, setScheduledTime] = useState(config?.scheduledTime || '09:00');
  
  // Initialize active channels. Default to Email if nothing set.
  const [activeChannels, setActiveChannels] = useState<('WHATSAPP' | 'EMAIL')[]>(
    config?.activeChannels || ['EMAIL']
  );
  
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
      emailAddress: email,
      lastRun: config?.lastRun || null,
      autoRun,
      activeChannels,
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

  const toggleChannel = (channel: 'WHATSAPP' | 'EMAIL') => {
    if (activeChannels.includes(channel)) {
      setActiveChannels(activeChannels.filter(c => c !== channel));
    } else {
      setActiveChannels([...activeChannels, channel]);
    }
  };

  // Test Functions
  const testWhatsApp = () => {
    if (!phone) {
      alert("Please enter a phone number first.");
      return;
    }
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent("Test message from EnergyScout. Configuration working!")}`, '_blank');
  };

  const testEmail = () => {
    const subject = encodeURIComponent("EnergyScout Configuration Test");
    const body = encodeURIComponent("If you are reading this, your email configuration link is working properly.");
    // If email is provided, we can try to pre-fill the 'to' field in mailto if the client supports it, 
    // but usually mailto just opens the client. We can try `mailto:email?`
    const mailto = email ? `mailto:${email}?subject=${subject}&body=${body}` : `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  if (isEditing) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8 shadow-xl animate-fade-in">
        <div className="flex items-center gap-2 mb-4 text-energy-400">
          <Settings className="h-5 w-5" />
          <h2 className="font-semibold text-white">Automation Configuration</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Topic Section */}
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
          
          {/* Notification Channels Section */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Notification Channels</h3>
            
            {/* WhatsApp Config */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <input 
                      type="checkbox" 
                      id="use-wa"
                      checked={activeChannels.includes('WHATSAPP')}
                      onChange={() => toggleChannel('WHATSAPP')}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-energy-600 focus:ring-energy-500"
                   />
                   <label htmlFor="use-wa" className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
                     <MessageCircle className="h-4 w-4 text-[#25D366]" />
                     WhatsApp
                   </label>
                 </div>
                 <button 
                  type="button" 
                  onClick={testWhatsApp} 
                  className="text-xs flex items-center gap-1 text-[#25D366] hover:underline opacity-80 hover:opacity-100"
                >
                   <Send className="h-3 w-3" /> Test
                 </button>
               </div>
               <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Number (e.g., 201xxxxxxxxx)"
                className={`w-full bg-slate-900 border ${activeChannels.includes('WHATSAPP') && !phone ? 'border-red-500/50' : 'border-slate-700'} text-white rounded-lg px-4 py-2 text-sm focus:border-energy-500 outline-none transition-colors`}
              />
            </div>

            <div className="h-px bg-slate-800 my-2"></div>

            {/* Email Config */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <input 
                      type="checkbox" 
                      id="use-email"
                      checked={activeChannels.includes('EMAIL')}
                      onChange={() => toggleChannel('EMAIL')}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-energy-600 focus:ring-energy-500"
                   />
                   <label htmlFor="use-email" className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
                     <Mail className="h-4 w-4 text-sky-400" />
                     Email Client
                   </label>
                 </div>
                 <button 
                  type="button" 
                  onClick={testEmail}
                  className="text-xs flex items-center gap-1 text-sky-400 hover:underline opacity-80 hover:opacity-100"
                 >
                   <Send className="h-3 w-3" /> Test
                 </button>
               </div>
               <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address (Optional recipient)"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-energy-500 outline-none"
              />
            </div>
          </div>

          {/* Schedule Section */}
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
                  <span className="text-sm font-medium text-white block">Enable Scheduled Automation</span>
                  <span className="text-xs text-slate-400 block">App will check for news automatically.</span>
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
                {activeChannels.length === 0 && (
                   <p className="text-xs text-red-400">Please select at least one notification channel above.</p>
                )}
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
            <div className="flex gap-2">
              {config?.activeChannels.includes('EMAIL') && (
                 <span className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                   <Mail className="h-3 w-3"/> Email
                 </span>
              )}
              {config?.activeChannels.includes('WHATSAPP') && (
                 <span className="flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                   <MessageCircle className="h-3 w-3"/> WA
                 </span>
              )}
            </div>
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