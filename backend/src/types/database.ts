// Database model types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recording {
  id: string;
  userId?: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  duration?: number;
  filePath: string;
  status: RecordingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transcript {
  id: string;
  recordingId: string;
  content: string; // JSON string
  rawTranscript: string;
  speakerCount: number;
  confidenceScore?: number;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiInsight {
  id: string;
  recordingId: string;
  insightType: InsightType;
  content: string; // JSON string
  promptUsed?: string;
  model?: string;
  createdAt: Date;
}

// Enum constants (since SQLite doesn't support native enums)
export const RecordingStatus = {
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  TRANSCRIBING: 'TRANSCRIBING',
  DIARIZING: 'DIARIZING',
  ANALYZING: 'ANALYZING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export const InsightType = {
  SUMMARY: 'SUMMARY',
  ACTION_ITEMS: 'ACTION_ITEMS',
  SENTIMENT: 'SENTIMENT',
  TOPICS: 'TOPICS',
  CUSTOM: 'CUSTOM',
} as const;

export type RecordingStatus = typeof RecordingStatus[keyof typeof RecordingStatus];
export type InsightType = typeof InsightType[keyof typeof InsightType];

// Parsed content types
export interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface TranscriptContent {
  segments: TranscriptSegment[];
  speakers: string[];
  summary: {
    totalSpeakers: number;
    totalDuration: number;
  };
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SummaryContent {
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  nextSteps: string[];
}

export interface SentimentContent {
  overall: 'positive' | 'neutral' | 'negative';
  confidence: number;
  speakers: Record<string, {
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
  }>;
}

export interface TopicsContent {
  mainTopics: Array<{
    topic: string;
    confidence: number;
    keywords: string[];
  }>;
  categories: string[];
} 