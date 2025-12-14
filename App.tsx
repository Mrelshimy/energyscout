import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { SearchControls } from './components/SearchControls';
import { ResultsFeed } from './components/ResultsFeed';
import { EmailModal } from './components/EmailModal';
import { DailyAutomation } from './components/DailyAutomation';
import { searchEnergyNews, generateEmailNewsletter } from './services/geminiService';
import { NewsReport, AppStatus, EmailDraft, DailyConfig } from './types';
import { AlertCircle, Loader2, UserCircle, Send, MessageCircle, Mail, AlertTriangle, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [report, setReport] = useState<NewsReport | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyConfig, setDailyConfig] = useState<DailyConfig | null>(null);
  
  // Automation State
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [pendingAutoActions, setPendingAutoActions] = useState<DailyConfig['activeChannels'] | null>(null);
  
  // Ref to prevent double-firing in strict mode or rapid updates
  const isProcessingRef = useRef(false);

  // Request Notification Permissions on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Load config from local storage on mount
  useEffect(() => {
    // Load Automation Config
    const savedConfig = localStorage.getItem('energyScout_dailyConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig) as DailyConfig;
        if (!config.activeChannels) config.activeChannels = ['EMAIL'];
        setDailyConfig(config);
      } catch (e) {
        console.error("Failed to parse daily config", e);
      }
    }
  }, []);

  // SCHEDULER: Check time every 30 seconds
  useEffect(() => {
    if (!dailyConfig || !dailyConfig.autoRun || !dailyConfig.scheduledTime) return;

    const checkSchedule = () => {
      if (isProcessingRef.current || status === AppStatus.SEARCHING) return;

      const now = new Date();
      if (dailyConfig.lastRun) {
        const last = new Date(dailyConfig.lastRun);
        if (last.getDate() === now.getDate() && last.getMonth() === now.getMonth()) {
          return; // Already run today
        }
      }

      const [targetHour, targetMinute] = dailyConfig.scheduledTime.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute)) {
        console.log("Scheduler: Triggering daily scan...");
        isProcessingRef.current = true;
        setIsAutoRunning(true);
        handleSearch(dailyConfig.topic, true);
      }
    };

    const timer = setInterval(checkSchedule, 30000); 
    return () => clearInterval(timer);
  }, [dailyConfig, status]);

  const saveDailyConfig = (config: DailyConfig) => {
    setDailyConfig(config);
    localStorage.setItem('energyScout_dailyConfig', JSON.stringify(config));
  };

  const updateLastRun = () => {
    if (dailyConfig) {
      const updatedConfig = { ...dailyConfig, lastRun: new Date().toISOString() };
      saveDailyConfig(updatedConfig);
    }
    // Clean up
    setIsAutoRunning(false);
    isProcessingRef.current = false;
  };

  const handleSearch = async (query: string, isAutomated = false) => {
    setStatus(AppStatus.SEARCHING);
    setErrorMsg(null);
    setReport(null);
    setPendingAutoActions(null);
    
    try {
      const result = await searchEnergyNews(query);
      const newReport = {
        rawText: result.text,
        sources: result.sources,
        timestamp: new Date()
      };
      setReport(newReport);
      setStatus(AppStatus.COMPLETE);

      if (isAutomated && dailyConfig) {
         // Notify user via System Notification
         if (Notification.permission === 'granted') {
           new Notification('EnergyScout Report Ready', { 
             body: `Latest updates on ${dailyConfig.topic} are available. Click to send.`,
             icon: '/favicon.ico'
           });
         }

         // Try to execute immediately
         const channels = dailyConfig.activeChannels || [];
         let blocked = false;

         if (channels.includes('WHATSAPP')) {
             const success = triggerWhatsAppShare(newReport, dailyConfig.phoneNumber);
             if (!success) blocked = true;
         }
         
         if (channels.includes('EMAIL')) {
            // For automation, we just open the modal and try to fire mailto
            triggerEmailDrafting(newReport.rawText, true).then((success) => {
               if (!success) setPendingAutoActions(channels);
            });
         } else if (blocked) {
             // If WhatsApp blocked and no email, show pending actions
             setPendingAutoActions(channels);
         }
         
         updateLastRun();
      } else {
        isProcessingRef.current = false;
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus(AppStatus.ERROR);
      setIsAutoRunning(false);
      isProcessingRef.current = false;
    }
  };

  // Returns true if opened, false if blocked
  const triggerWhatsAppShare = (reportData: NewsReport, phone: string): boolean => {
    const cleanNumber = phone ? phone.replace(/[^0-9]/g, '') : '';
    const sourceList = reportData.sources.map(s => `• ${s.title}: ${s.uri}`).join('\n');
    const message = `*EnergyScout Update - Sources:*\n\n${sourceList}`;
    const encodedMessage = encodeURIComponent(message);
    const url = cleanNumber 
      ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
      
    const win = window.open(url, '_blank');
    return !!win;
  };

  // Returns true if opened, false if blocked
  const triggerEmailDrafting = async (text: string, isAutomated = false): Promise<boolean> => {
    setStatus(AppStatus.DRAFTING_EMAIL);
    try {
      const draft = await generateEmailNewsletter(text);
      setEmailDraft(draft);
      setIsModalOpen(true);
      setStatus(AppStatus.COMPLETE);
      
      if (isAutomated) {
        const subject = encodeURIComponent(draft.subject);
        const body = encodeURIComponent(draft.body);
        const recipient = dailyConfig?.emailAddress ? dailyConfig.emailAddress : '';
        const win = window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_blank');
        return !!win;
      }
      return true;
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate email draft.");
      setStatus(AppStatus.ERROR);
      return false;
    }
  };

  const handlePendingActions = () => {
    if (!dailyConfig || !report || !pendingAutoActions) return;
    
    if (pendingAutoActions.includes('WHATSAPP')) {
      triggerWhatsAppShare(report, dailyConfig.phoneNumber);
    }
    if (pendingAutoActions.includes('EMAIL')) {
      triggerEmailDrafting(report.rawText, true);
    }
    setPendingAutoActions(null);
  };

  return (
    <Layout>
      <div className="absolute top-4 right-4 z-50">
        <button 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-default"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
             <UserCircle className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">Guest</span>
        </button>
      </div>

      {/* Action Banner for Blocked Popups */}
      {pendingAutoActions && !isAutoRunning && (
        <div className="mb-6 bg-energy-900/40 border border-energy-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce-in shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-energy-500 rounded-full text-white">
                <AlertTriangle className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-bold text-white">Daily Report Ready</h3>
               <p className="text-sm text-slate-300">Browser blocked automatic opening. Click to send.</p>
             </div>
          </div>
          <button 
            onClick={handlePendingActions}
            className="whitespace-nowrap flex items-center gap-2 px-5 py-2.5 bg-energy-600 hover:bg-energy-500 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105"
          >
            <Send className="h-4 w-4" /> Send Updates
          </button>
        </div>
      )}

      <DailyAutomation 
        config={dailyConfig} 
        onSaveConfig={saveDailyConfig} 
        onRunDaily={(topic) => handleSearch(topic, false)}
        isLoading={status === AppStatus.SEARCHING}
      />

      <SearchControls onSearch={(q) => handleSearch(q, false)} status={status} />

      {errorMsg && (
        <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-6 animate-pulse">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {isAutoRunning && status === AppStatus.SEARCHING && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
           <Loader2 className="h-12 w-12 text-energy-500 animate-spin mb-4" />
           <h3 className="text-xl font-bold text-white">Auto-Pilot Active</h3>
           <p className="text-slate-400">Scanning for "{dailyConfig?.topic}"...</p>
        </div>
      )}

      {report && (
        <ResultsFeed 
          report={report} 
          onDraftEmail={() => triggerEmailDrafting(report.rawText, false)}
          onShareWhatsApp={() => triggerWhatsAppShare(report, dailyConfig?.phoneNumber || '')}
          isDrafting={status === AppStatus.DRAFTING_EMAIL}
          defaultPhone={dailyConfig?.phoneNumber}
        />
      )}

      {!report && status !== AppStatus.SEARCHING && !errorMsg && (
        <div className="text-center py-20 text-slate-600">
          <div className="w-16 h-16 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Zap className="w-8 h-8 text-slate-700" />
          </div>
          <p>Ready to scout for energy metering updates.</p>
        </div>
      )}

      <EmailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        draft={emailDraft} 
      />
    </Layout>
  );
};

export default App;