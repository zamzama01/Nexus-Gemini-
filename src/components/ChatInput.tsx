import React, { useState, useRef, useEffect } from "react";
import { Attachment } from "../types.ts";
import { AudioRecorder } from "../utils/audio.ts";
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  Image as ImageIcon,
  Loader2,
  FileText,
} from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  disabled = false,
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [content]);

  // Focus textarea when streaming finishes
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  // Process uploaded files
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      // 20MB limit
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 20MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const fullDataUrl = reader.result as string;
        const base64Data = fullDataUrl.split(",")[1];

        const newAttachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          data: base64Data,
          previewUrl: fullDataUrl,
          size: file.size,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || isStreaming || disabled) {
      return;
    }

    onSendMessage(content.trim(), attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Enter / Shift+Enter keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Microphone recording
  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);

      try {
        if (recorderRef.current) {
          const { base64, mimeType } = await recorderRef.current.stop();
          recorderRef.current = null;

          // Call server transcription endpoint
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioData: base64, mimeType }),
          });

          if (!res.ok) {
            throw new Error("Failed to transcribe audio");
          }

          const data = await res.json();
          if (data.text) {
            setContent((prev) => (prev ? `${prev} ${data.text}` : data.text));
          }
        }
      } catch (err) {
        console.error("Audio recording/transcription failed:", err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      try {
        recorderRef.current = new AudioRecorder();
        await recorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to access microphone:", err);
        alert("Microphone access is needed for audio transcription.");
        setIsRecording(false);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-full max-w-4xl mx-auto px-4 md:px-6 pb-6 pt-2 relative z-20"
    >
      <div className="relative">
        {/* Immersive Outer Ambient Blur for Input Dock */}
        <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-3xl -z-10" />

        <div
          className={`relative flex flex-col rounded-2xl border transition-all duration-200 bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl ${
            isDragging
              ? "border-blue-400 bg-blue-950/30 ring-2 ring-blue-500/50"
              : "focus-within:border-blue-500/40 focus-within:ring-2 focus-within:ring-blue-500/10"
          }`}
        >
          {/* Drag overlay notice */}
          {isDragging && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-[#020617]/95 border border-blue-400 backdrop-blur-md text-blue-300 font-medium text-sm gap-2">
              <ImageIcon className="w-5 h-5 animate-bounce" />
              <span>Drop images or files to attach to prompt</span>
            </div>
          )}

          {/* Attachment Preview Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-b border-white/5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#020617]/80 border border-white/10 text-xs text-slate-200 shadow-md backdrop-blur-sm"
                >
                  {att.mimeType.startsWith("image/") ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <span className="truncate max-w-[120px] font-mono text-[11px]">
                    {att.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 rounded-md hover:bg-red-950/80 hover:text-red-300 text-slate-400 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea Input */}
          <div className="flex items-end px-3 py-2">
            {/* File Upload Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.json,.ts,.tsx,.js,.py"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />

            {/* Attach button */}
            <button
              id="attach-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex-shrink-0"
              title="Attach image or document"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              id="chat-input-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={1}
              placeholder={
                isRecording
                  ? "Listening... speak now into your microphone"
                  : isTranscribing
                  ? "Transcribing audio verbatim..."
                  : "Query Nexus Gemini..."
              }
              className="flex-1 max-h-[200px] min-h-[44px] py-2.5 px-3 bg-transparent text-white placeholder:text-slate-500 text-base md:text-lg focus:outline-none resize-none font-light leading-relaxed"
            />

            {/* Controls Bar inside input */}
            <div className="flex items-center gap-2 pb-1 pr-1">
              {/* Mic button */}
              <button
                id="mic-recording-btn"
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isRecording
                    ? "bg-red-900/60 text-red-300 ring-2 ring-red-500 animate-pulse"
                    : isTranscribing
                    ? "bg-blue-950 text-blue-400"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title={
                  isRecording
                    ? "Stop recording"
                    : isTranscribing
                    ? "Transcribing..."
                    : "Record voice audio"
                }
              >
                {isTranscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Send or Stop Button */}
              {isStreaming ? (
                <button
                  id="stop-streaming-btn"
                  type="button"
                  onClick={onStopStreaming}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all font-medium text-sm flex items-center gap-2 cursor-pointer"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  id="send-message-btn"
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!content.trim() && attachments.length === 0}
                  className={`px-6 py-2.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 cursor-pointer ${
                    content.trim() || attachments.length > 0
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                      : "bg-slate-800/80 text-slate-500 cursor-not-allowed opacity-60"
                  }`}
                  title="Send message"
                >
                  <span>Process</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Immersive Theme Metadata Footer */}
      <div className="flex items-center justify-center gap-4 md:gap-8 mt-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold select-none">
        <span>Modalities: Text, Image, Audio, Code</span>
        <span className="text-blue-500/50">•</span>
        <span>Context: 1.5M+ Tokens</span>
        <span className="hidden sm:inline text-blue-500/50">•</span>
        <span className="hidden sm:inline">Real-Time Streaming</span>
      </div>
    </div>
  );
};
