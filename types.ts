// PDF.js global type definition augmentation
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface PageData {
  pageIndex: number; // 0-based index
  pageNumber: number; // 1-based display number
  imageBase64: string; // Data URL of the rendered page
  width: number;
  height: number;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  GENERATING_TEXT = 'GENERATING_TEXT',
  TEXT_COMPLETE = 'TEXT_COMPLETE',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface StudyItem {
  pageIndex: number;
  explanation: string | null;
  audioUrl: string | null;
  status: ProcessStatus;
  error?: string;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  SELECT = 'SELECT',
  STUDY = 'STUDY',
}