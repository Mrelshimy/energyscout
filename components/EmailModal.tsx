import React, { useState } from 'react';
import { X, Copy, Mail, Check } from 'lucide-react';
import { EmailDraft } from '../types';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: EmailDraft | null;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, draft }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !draft) return null;

  const handleCopy = () => {
    const fullText = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailTo = () => {
    const subject = encodeURIComponent(draft.subject);
    const body = encodeURIComponent(draft.body);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-semibold text-white">Email Preview</h3>
            <p className="text-sm text-slate-400">Review and share your newsletter</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm font-medium">
              {draft.subject}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Body</label>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {draft.body}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied to Clipboard" : "Copy Text"}
          </button>
          
          <button
            onClick={handleMailTo}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-energy-600 hover:bg-energy-500 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-energy-900/20"
          >
            <Mail className="h-4 w-4" />
            Open Email Client
          </button>
        </div>

      </div>
    </div>
  );
};
