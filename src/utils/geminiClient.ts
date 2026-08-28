import { GoogleGenAI } from "@google/genai";
import { Message, GeminiModelId, ThinkingLevel } from "../types";

export interface StreamDirectOptions {
  messages: Message[];
  model: GeminiModelId;
  systemPrompt?: string;
  temperature?: number;
  enableSearchGrounding?: boolean;
  thinkingLevel?: ThinkingLevel;
  apiKey: string;
  onChunk: (text: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function streamGeminiDirect(options: StreamDirectOptions): Promise<void> {
  const {
    messages,
    model,
    systemPrompt,
    temperature = 0.7,
    enableSearchGrounding = false,
    thinkingLevel = "default",
    apiKey,
    onChunk,
    onError,
    onDone,
    signal,
  } = options;

  if (!apiKey || !apiKey.trim()) {
    onError("A Gemini API Key is required for direct client execution. Please enter your API key in Settings.");
    onDone();
    return;
  }

  const primaryModel = model || "gemini-3.7-flash";
  const fallbackModels = Array.from(
    new Set([
      primaryModel,
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
      "gemini-3.7-flash",
    ])
  );

  let streamedAny = false;
  let lastError: any = null;

  for (const currentModel of fallbackModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (signal?.aborted) {
          onDone();
          return;
        }

        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

        const contents = messages.map((m) => {
          const parts: any[] = [];

          if (m.attachments && Array.isArray(m.attachments)) {
            for (const att of m.attachments) {
              if (att.data && att.mimeType) {
                parts.push({
                  inlineData: {
                    mimeType: att.mimeType,
                    data: att.data,
                  },
                });
              }
            }
          }

          if (m.content) {
            parts.push({ text: m.content });
          } else if (parts.length === 0) {
            parts.push({ text: " " });
          }

          return {
            role: m.role === "assistant" ? "model" : "user",
            parts,
          };
        });

        const config: any = {
          temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
        };

        if (systemPrompt && systemPrompt.trim()) {
          config.systemInstruction = systemPrompt.trim();
        }

        if (enableSearchGrounding && currentModel !== "gemini-3.1-flash-lite") {
          config.tools = [{ googleSearch: {} }];
        }

        if (thinkingLevel && thinkingLevel !== "default" && currentModel !== "gemini-3.1-flash-lite") {
          config.thinkingConfig = {
            thinkingLevel: thinkingLevel === "high" ? "HIGH" : "LOW",
          };
        }

        const responseStream = await ai.models.generateContentStream({
          model: currentModel as any,
          contents,
          config,
        });

        for await (const chunk of responseStream) {
          if (signal?.aborted) {
            onDone();
            return;
          }
          const text = chunk.text || "";
          if (text) {
            streamedAny = true;
            onChunk(text);
          }
        }

        onDone();
        return;
      } catch (error: any) {
        lastError = error;
        if (signal?.aborted) {
          onDone();
          return;
        }

        const errString = error?.message || String(error);
        const is503 =
          errString.includes("503") ||
          errString.includes("high demand") ||
          errString.includes("UNAVAILABLE");

        if (streamedAny) {
          console.warn(`Direct Stream interrupted mid-generation on ${currentModel}:`, errString);
          onError(errString);
          onDone();
          return;
        }

        console.warn(
          `Direct model ${currentModel} attempt ${attempt + 1} failed (${is503 ? "503 High Demand" : "Error"}):`,
          errString.slice(0, 150)
        );

        if (is503 && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }

        break;
      }
    }
  }

  let msg = lastError?.message || String(lastError);
  if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
    msg = "The model is experiencing temporary high demand across providers. Please try again in a moment.";
  } else if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
    msg = "The provided Gemini API key is invalid. Please verify your key in Settings.";
  }
  onError(msg);
  onDone();
}

export async function generateTitleDirect(prompt: string, apiKey: string): Promise<string> {
  const cleanFallback = () => {
    const words = prompt.trim().replace(/[^\w\s]/g, "").split(/\s+/).slice(0, 5).join(" ");
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : "New Conversation";
  };

  if (!apiKey) return cleanFallback();

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Generate a short, concise, engaging title (maximum 3 to 5 words, no punctuation, no quotes, no title prefixes) summarizing the following prompt:\n\n"${prompt.slice(0, 400)}"`,
      config: { temperature: 0.2 },
    });
    const title = (res.text || "").trim().replace(/^["'`]|["'`]$/g, "");
    return title && title.length < 60 ? title : cleanFallback();
  } catch {
    return cleanFallback();
  }
}
