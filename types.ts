export interface SearchSource {
  title: string;
  uri: string;
}

export interface NewsReport {
  rawText: string;
  sources: SearchSource[];
  timestamp: Date;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  DRAFTING_EMAIL = 'DRAFTING_EMAIL',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface DailyConfig {
  topic: string;
  phoneNumber: string;
  lastRun: string | null;
  autoRun: boolean;
  channel: 'WHATSAPP' | 'EMAIL';
  scheduledTime: string; // Format "HH:mm"
}