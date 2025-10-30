
export type Document = {
  id: string;
  title: string;
  content: string; // For text, this is the text. For media, this is a data URL.
  type: 'text' | 'image' | 'audio' | 'video';
  metadata: {
    duration?: number; // for audio/video
  };
  transcript?: string; // For audio/video transcripts
  isTranscribing?: boolean; // To show loading state
};

export type Code = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type Quote = {
  id:string;
  documentId: string;
  codeId: string;
  text: string;
  // For text documents or transcripts
  start?: number;
  end?: number;
  // For other document types (e.g., image regions, audio/video timestamps)
  region?: { x: number; y: number; width: number; height: number }; // For images
  timestamp?: { start: number; end: number }; // For audio/video
};

export type Comment = {
  id: string;
  quoteId: string;
  text: string;
  createdAt: string; // ISO 8601 date string
};

// Represents a user's text selection that hasn't been coded yet.
export type Segment = {
  text: string;
  start: number;
  end: number;
};

export type ChatMessage = {
    sender: 'user' | 'ai';
    text: string;
};

// Represents a theme suggested by the AI
export type AiSuggestedTheme = {
    code: Omit<Code, 'id' | 'color'>;
    quotes: string[];
};
