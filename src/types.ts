export type GeminiModelId = 
  | 'gemini-3.7-flash' 
  | 'gemini-3.1-flash-lite' 
  | 'gemini-3.1-pro-preview';

export type ThinkingLevel = 'default' | 'low' | 'high';

export type AppTheme = 'nexus-cyber' | 'dark' | 'light';

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 string without data: prefix
  previewUrl: string; // Full data url for rendering
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  modelUsed?: GeminiModelId;
  thinkingProcess?: string;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  modelId: GeminiModelId;
  isPinned?: boolean;
  systemPrompt?: string;
  temperature?: number;
  searchGrounding?: boolean;
}

export interface SystemPersona {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  recommendedModel: GeminiModelId;
  recommendedTemp: number;
}

export interface AppSettings {
  defaultModel: GeminiModelId;
  theme: AppTheme;
  customSystemPrompt: string;
  activePersonaId: string;
  temperature: number;
  enableSearchGrounding: boolean;
  thinkingLevel: ThinkingLevel;
  autoTitle: boolean;
  speechVoice: string;
  speechRate: number;
  customApiKey?: string;
}
