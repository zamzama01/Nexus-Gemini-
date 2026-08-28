import { GeminiModelId, SystemPersona, AppSettings } from "../types.ts";

export interface ModelInfo {
  id: GeminiModelId;
  name: string;
  badge: string;
  description: string;
  speed: 'Ultra Fast' | 'Fast' | 'Balanced';
  intelligence: 'High' | 'Very High' | 'Maximum';
  supportsImages: boolean;
  supportsThinking: boolean;
  color: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    badge: "Flagship / Hybrid",
    description: "Next-gen multimodal model with hybrid reasoning & lightning responses.",
    speed: "Ultra Fast",
    intelligence: "Maximum",
    supportsImages: true,
    supportsThinking: true,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    badge: "Lightweight Speed",
    description: "Optimized for extreme throughput, snappy real-time conversations & low latency.",
    speed: "Ultra Fast",
    intelligence: "High",
    supportsImages: true,
    supportsThinking: false,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    badge: "Deep Reasoning",
    description: "Advanced model for deep mathematical logic, full-stack programming & STEM problems.",
    speed: "Balanced",
    intelligence: "Maximum",
    supportsImages: true,
    supportsThinking: true,
    color: "from-purple-500 to-indigo-600",
  },
];

export const SYSTEM_PERSONAS: SystemPersona[] = [
  {
    id: "nexus-core",
    name: "Nexus Core AI",
    icon: "Sparkles",
    description: "Adaptive, highly accurate, and balanced assistant for general tasks.",
    systemPrompt: "You are Nexus Gemini AI, an advanced intelligence system powered by Google DeepMind Gemini models. Provide clear, precise, helpful, and beautifully structured responses with markdown formatting.",
    recommendedModel: "gemini-3.7-flash",
    recommendedTemp: 0.7,
  },
  {
    id: "code-architect",
    name: "Code Architect",
    icon: "Code2",
    description: "Software engineering wizard providing production-ready, clean TypeScript & algorithms.",
    systemPrompt: "You are an elite Senior Staff Software Architect and Full-Stack Engineering mentor. Always provide clean, robust, type-safe, and idiomatic code with concise explanations and potential edge-case caveats.",
    recommendedModel: "gemini-3.7-flash",
    recommendedTemp: 0.2,
  },
  {
    id: "deep-thinker",
    name: "Deep Reasoner",
    icon: "Brain",
    description: "Analytical breakdown, step-by-step mathematical logic and critical analysis.",
    systemPrompt: "You are an analytical researcher. Break down complex queries step by step, evaluate hypotheses rigorously, cross-verify logical assertions, and provide well-reasoned syntheses.",
    recommendedModel: "gemini-3.1-pro-preview",
    recommendedTemp: 0.3,
  },
  {
    id: "creative-synthesizer",
    name: "Creative Visionary",
    icon: "Palette",
    description: "Expressive writer, creative brainstormer, storytelling and UI/UX design.",
    systemPrompt: "You are a creative director and visionary writer. Craft vivid, imaginative, engaging, and inspiring content with rich metaphors and original perspectives.",
    recommendedModel: "gemini-3.7-flash",
    recommendedTemp: 0.9,
  },
  {
    id: "concise-expert",
    name: "Concise Summarizer",
    icon: "Zap",
    description: "Direct, zero-fluff answers and executive summaries.",
    systemPrompt: "You are a high-efficiency executive intelligence agent. Answer directly and concisely. Use bullet points and bold key terms with minimum fluff.",
    recommendedModel: "gemini-3.1-flash-lite",
    recommendedTemp: 0.4,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: "gemini-3.7-flash",
  theme: "nexus-cyber",
  customSystemPrompt: "",
  activePersonaId: "nexus-core",
  temperature: 0.7,
  enableSearchGrounding: false,
  thinkingLevel: "default",
  autoTitle: true,
  speechVoice: "default",
  speechRate: 1.0,
};

export const PROMPT_SUGGESTIONS = [
  {
    category: "Development",
    icon: "Terminal",
    prompts: [
      {
        title: "Build a Custom React Hook",
        desc: "useDebouncedValue with TypeScript and unit tests",
        prompt: "Write a high-performance custom React hook `useDebouncedValue<T>` in TypeScript with generic typing, cleanup handlers, and example usage in a search input component.",
      },
      {
        title: "Microservices vs Modular Monolith",
        desc: "Architectural comparison for scalable web apps",
        prompt: "Explain the practical trade-offs between a Modular Monolith and Microservices architecture for a high-traffic SaaS app. Include database considerations and latency impacts.",
      },
      {
        title: "Optimize SQL Query",
        desc: "Indexing strategy and execution plan debugging",
        prompt: "How do I optimize slow multi-table JOIN queries with WHERE clauses in PostgreSQL? Provide indexing best practices, EXPLAIN ANALYZE interpretation, and common pitfalls.",
      },
    ],
  },
  {
    category: "Science & AI",
    icon: "Atom",
    prompts: [
      {
        title: "Quantum Computing Principles",
        desc: "Qubits, superposition, and entanglement explained",
        prompt: "Explain the fundamental principles of quantum computing—superposition, entanglement, and quantum gates—using intuitive analogies and contrast them with classical binary bits.",
      },
      {
        title: "Transformer Attention Mechanism",
        desc: "Self-attention mathematical breakdown",
        prompt: "Break down the mathematical formulation of scaled dot-product attention in Transformer neural networks: Queries, Keys, Values, softmax temperature scaling, and multi-head benefits.",
      },
    ],
  },
  {
    category: "Creativity & Strategy",
    icon: "Sparkles",
    prompts: [
      {
        title: "Startup Pitch & Strategy",
        desc: "AI-driven automated health diagnostics tool",
        prompt: "Craft a compelling 2-minute elevator pitch and business model canvas strategy for a hypothetical B2B healthcare AI diagnostics validation platform.",
      },
      {
        title: "Sci-Fi Cyberpunk Scenario",
        desc: "Atmospheric narrative on sentient orbital relay",
        prompt: "Write an evocative, atmospheric opening scene for a sci-fi novel about a lone communications engineer stationed on a deep-space orbital relay station that suddenly detects an encrypted signal from 100 years in the future.",
      },
    ],
  },
];
