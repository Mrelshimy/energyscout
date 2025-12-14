import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { SearchControls } from './components/SearchControls';
import { ResultsFeed } from './components/ResultsFeed';
import { EmailModal } from './components/EmailModal';
import { DailyAutomation } from './components/DailyAutomation';
import { searchEnergyNews, generateEmailNewsletter } from './services/geminiService';
import { NewsReport, AppStatus, EmailDraft, DailyConfig } from './types';
import { AlertCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [report, setReport] = useState<NewsReport | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyConfig, setDailyConfig] = useState<DailyConfig | null>(null);
  
  // Track if we are currently running an automation sequence
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  // Ref to prevent double-firing in strict mode or rapid updates
  const isProcessingRef = useRef(false);

  // Load config from local storage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('energyScout_dailyConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig) as DailyConfig;
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
      
      // Check if already run today
      if (dailyConfig.lastRun) {
        const last = new Date(dailyConfig.lastRun);
        if (last.getDate() === now.getDate() && last.getMonth() === now.getMonth()) {
          return; // Already run today
        }
      }

      // Check time
      const [targetHour, targetMinute] = dailyConfig.scheduledTime.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Trigger if current time is equal to or past target time
      if (currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute)) {
        console.log("Scheduler: Triggering daily scan...");
        isProcessingRef.current = true;
        setIsAutoRunning(true);
        handleSearch(dailyConfig.topic, true);
      }
    };

    const timer = setInterval(checkSchedule, 30000); // Check every 30s
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
      setIsAutoRunning(false);
      isProcessingRef.current = false;
    }
  };

  const handleSearch = async (query: string, isAutomated = false) => {
    setStatus(AppStatus.SEARCHING);
    setErrorMsg(null);
    setReport(null);
    
    try {
      const result = await searchEnergyNews(query);
      const newReport = {
        rawText: result.text,
        sources: result.sources,
        timestamp: new Date()
      };
      setReport(newReport);
      setStatus(AppStatus.COMPLETE);

      // If this was an automated run, immediately trigger the preferred channel action
      if (isAutomated && dailyConfig) {
         if (dailyConfig.channel === 'WHATSAPP') {
           // Wait a brief moment for UI to settle
           setTimeout(() => {
             triggerWhatsAppShare(newReport, dailyConfig.phoneNumber);
             updateLastRun();
           }, 1000);
         } else {
           triggerEmailDrafting(newReport.rawText, true);
         }
      } else {
        // Reset manual processing flag if manual search finishes
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

  const triggerWhatsAppShare = (reportData: NewsReport, phone: string) => {
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const sourceList = reportData.sources.map(s => `• ${s.title}: ${s.uri}`).join('\n');
    const message = `*EnergyScout Update - Sources:*\n\n${sourceList}`;
    const encodedMessage = encodeURIComponent(message);
    const url = cleanNumber 
      ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
      
    // Attempt to open. Note: Browsers might block this if not user-initiated.
    const win = window.open(url, '_blank');
    if (!win) {
      setErrorMsg("Auto-open blocked by browser. Please allow popups for EnergyScout.");
    }
  };

  const triggerEmailDrafting = async (text: string, isAutomated = false) => {
    setStatus(AppStatus.DRAFTING_EMAIL);
    try {
      const draft = await generateEmailNewsletter(text);
      setEmailDraft(draft);
      setIsModalOpen(true);
      setStatus(AppStatus.COMPLETE);
      
      if (isAutomated) {
        const subject = encodeURIComponent(draft.subject);
        const body = encodeURIComponent(draft.body);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        updateLastRun();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate email draft.");
      setStatus(AppStatus.ERROR);
      setIsAutoRunning(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <Layout>
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
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
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
            <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
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