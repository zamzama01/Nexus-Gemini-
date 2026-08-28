import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build-vercel",
        },
      },
    });
  }
  return aiClient;
}

function formatGeminiError(error: any): string {
  if (!error) return "An unexpected error occurred.";
  let msg = error.message || String(error);

  try {
    const parsed = typeof msg === "string" ? JSON.parse(msg) : msg;
    if (parsed?.error?.message) {
      try {
        const inner = JSON.parse(parsed.error.message);
        if (inner?.error?.message) {
          msg = inner.error.message;
        } else {
          msg = parsed.error.message;
        }
      } catch {
        msg = parsed.error.message;
      }
    }
  } catch {
    // Keep msg as is
  }

  if (typeof msg === "string") {
    if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
      return "The requested neural model is temporarily experiencing peak demand. Please retry or choose a different model.";
    }
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return "Rate limit exceeded. Please pause for a moment and try again.";
    }
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      return "Gemini API key is invalid or missing in server environment variables.";
    }
  }

  return typeof msg === "string" ? msg : "An error occurred during response generation.";
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
    environment: "vercel-serverless",
  });
});

// Stream Chat Completion Endpoint using Server-Sent Events (SSE)
app.post("/api/chat/stream", async (req: Request, res: Response) => {
  const {
    messages,
    model = "gemini-3.7-flash",
    systemPrompt,
    temperature = 0.7,
    enableSearchGrounding = false,
    thinkingLevel = "default",
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Messages array is required." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const contents = messages.map((m: any) => {
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
      parts.push({
        text: m.content,
      });
    } else if (parts.length === 0) {
      parts.push({ text: " " });
    }

    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });

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
        const ai = getAIClient();

        const config: any = {
          temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
        };

        if (systemPrompt && typeof systemPrompt === "string" && systemPrompt.trim()) {
          config.systemInstruction = systemPrompt.trim();
        }

        if (enableSearchGrounding && currentModel !== "gemini-3.1-flash-lite") {
          config.tools = [{ googleSearch: {} }];
        }

        if (
          thinkingLevel &&
          thinkingLevel !== "default" &&
          currentModel !== "gemini-3.1-flash-lite"
        ) {
          config.thinkingConfig = {
            thinkingLevel: thinkingLevel === "high" ? "HIGH" : "LOW",
          };
        }

        const responseStream = await ai.models.generateContentStream({
          model: currentModel,
          contents,
          config,
        });

        for await (const chunk of responseStream) {
          const text = chunk.text || "";
          if (text) {
            streamedAny = true;
            res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      } catch (error: any) {
        lastError = error;
        const errString = error?.message || String(error);
        const is503 =
          errString.includes("503") ||
          errString.includes("high demand") ||
          errString.includes("UNAVAILABLE");

        if (streamedAny) {
          console.warn(`Vercel Stream interrupted mid-generation on ${currentModel}:`, errString);
          const formattedErr = formatGeminiError(error);
          res.write(
            `data: ${JSON.stringify({
              error: formattedErr,
              done: true,
            })}\n\n`
          );
          res.end();
          return;
        }

        console.warn(
          `Vercel model ${currentModel} attempt ${attempt + 1} failed (${is503 ? "503 High Demand" : "Error"}):`,
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

  console.error("All fallback models failed on Vercel stream:", lastError);
  const formattedErr = formatGeminiError(lastError);
  res.write(
    `data: ${JSON.stringify({
      error: formattedErr,
      done: true,
    })}\n\n`
  );
  res.end();
});

// Title generation endpoint
app.post("/api/title", async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  const cleanFallbackTitle = () => {
    const words = prompt
      .trim()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .slice(0, 5)
      .join(" ");
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : "New Conversation";
  };

  const titleModels = ["gemini-3.1-flash-lite", "gemini-3.7-flash"];

  for (const modelId of titleModels) {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: modelId,
        contents: `Generate a short, concise, engaging title (maximum 3 to 5 words, no punctuation, no quotes, no title prefixes) summarizing the following user prompt:\n\n"${prompt.slice(
          0,
          400
        )}"`,
        config: {
          temperature: 0.2,
        },
      });

      const title = (response.text || "").trim().replace(/^["'`]|["'`]$/g, "");
      if (title && title.length < 60) {
        res.json({ title });
        return;
      }
    } catch (err: any) {
      console.warn(`Vercel title generation warning on ${modelId}:`, err?.message || err);
    }
  }

  res.json({ title: cleanFallbackTitle() });
});

// Audio transcription endpoint
app.post("/api/transcribe", async (req: Request, res: Response) => {
  const { audioData, mimeType = "audio/webm" } = req.body;

  if (!audioData) {
    res.status(400).json({ error: "audioData base64 string is required." });
    return;
  }

  try {
    const ai = getAIClient();
    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioData,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          audioPart,
          {
            text: "Transcribe the spoken audio verbatim into clean text. Output only the transcript without conversational filler.",
          },
        ],
      },
    });

    const transcript = (response.text || "").trim();
    res.json({ text: transcript });
  } catch (error: any) {
    console.error("Vercel Audio Transcription Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to transcribe audio",
    });
  }
});

export default app;
