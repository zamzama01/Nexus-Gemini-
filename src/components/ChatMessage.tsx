import React, { useState } from "react";
import { Message, Attachment } from "../types.ts";
import { MarkdownRenderer } from "./MarkdownRenderer.tsx";
import { tts } from "../utils/audio.ts";
import {
  Sparkles,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCw,
  Edit2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Bot,
  Sliders,
} from "lucide-react";

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
  onEditMessage?: (id: string, newContent: string) => void;
  onPreviewAttachment: (att: Attachment) => void;
  isSpeaking: boolean;
  onOpenSettings?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast,
  onRegenerate,
  onEditMessage,
  onPreviewAttachment,
  isSpeaking,
  onOpenSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy message:", e);
    }
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      tts.stop();
    } else {
      tts.speak(message.content, message.id);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditMessage) {
      onEditMessage(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group w-full py-6 px-4 md:px-8 transition-colors ${
        isUser
          ? "bg-transparent"
          : "bg-white/[0.02] border-y border-white/5 backdrop-blur-md"
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 md:gap-5 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 shadow-md">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="w-4 h-4" />
              {message.isStreaming && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content & Actions */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-xs md:text-sm text-white">
                {isUser ? "You" : "Nexus Gemini"}
              </span>
              {message.modelUsed && !isUser && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-medium">
                  {message.modelUsed}
                </span>
              )}
              <span className="text-[11px] text-slate-500 font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Copy button */}
              <button
                id={`copy-msg-${message.id}`}
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* TTS Playback */}
              {!isUser && (
                <button
                  id={`tts-msg-${message.id}`}
                  type="button"
                  onClick={handleToggleSpeech}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSpeaking
                      ? "bg-blue-500/20 text-blue-300 animate-pulse border border-blue-500/30"
                      : "hover:bg-white/10 text-slate-400 hover:text-white"
                  }`}
                  title={isSpeaking ? "Stop listening" : "Read aloud"}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Edit User Message */}
              {isUser && onEditMessage && (
                <button
                  id={`edit-msg-${message.id}`}
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Edit prompt"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Regenerate Assistant Response */}
              {!isUser && isLast && onRegenerate && (
                <button
                  id={`regenerate-msg-${message.id}`}
                  type="button"
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Attached Images / Files Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  onClick={() => onPreviewAttachment(att)}
                  className="relative group/att flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/40 transition-all cursor-pointer shadow-md backdrop-blur-sm"
                >
                  {att.mimeType.startsWith("image/") ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black flex-shrink-0">
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/att:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                      {att.name}
                    </p>
                    <span className="text-[10px] text-blue-400 font-mono">
                      {(att.size / 1024).toFixed(0)} KB • View
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-blue-400 opacity-0 group-hover/att:opacity-100 transition-opacity ml-1" />
                </div>
              ))}
            </div>
          )}

          {/* Editing Mode */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#020617] border border-blue-500/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sans resize-y min-h-[90px]"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  Save & Resubmit
                </button>
              </div>
            </div>
          ) : (
            /* Standard Message Output */
            <div className="text-slate-200">
              {message.error ? (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-2 text-xs md:text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-200">Processing Error</p>
                    <p className="mt-0.5 text-red-300/90 leading-relaxed">{message.error}</p>
                    <div className="mt-2.5 flex items-center flex-wrap gap-2">
                      {onRegenerate && isLast && (
                        <button
                          type="button"
                          onClick={onRegenerate}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-900/60 hover:bg-red-800/80 text-red-100 text-xs font-medium border border-red-700/50 cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" /> Retry Generation
                        </button>
                      )}
                      {onOpenSettings && (
                        <button
                          type="button"
                          onClick={onOpenSettings}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-900/60 hover:bg-blue-800/80 text-blue-100 text-xs font-medium border border-blue-700/50 cursor-pointer"
                        >
                          <Sliders className="w-3 h-3 text-blue-300" /> Open Settings
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <MarkdownRenderer content={message.content} />
                  {message.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
