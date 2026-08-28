import React, { useState, useEffect, useRef } from "react";
import {
  Conversation,
  Message,
  Attachment,
  GeminiModelId,
  AppSettings,
} from "./types.ts";
import {
  loadConversations,
  saveConversations,
  loadActiveConvId,
  saveActiveConvId,
  loadSettings,
  saveSettings,
} from "./utils/storage.ts";
import { SYSTEM_PERSONAS, DEFAULT_SETTINGS } from "./utils/constants.ts";
import { tts } from "./utils/audio.ts";
import { Header } from "./components/Header.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { ChatMessage } from "./components/ChatMessage.tsx";
import { ChatInput } from "./components/ChatInput.tsx";
import { PromptSuggestions } from "./components/PromptSuggestions.tsx";
import { SettingsModal } from "./components/SettingsModal.tsx";
import { ImageLightboxModal } from "./components/ImageLightboxModal.tsx";
import { ArrowDown, Sparkles } from "lucide-react";

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations()
  );
  const [activeConvId, setActiveConvId] = useState<string | null>(() =>
    loadActiveConvId()
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(
    settings.defaultModel || "gemini-3.7-flash"
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lightboxAttachment, setLightboxAttachment] =
    useState<Attachment | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Save active conversation id
  useEffect(() => {
    saveActiveConvId(activeConvId);
  }, [activeConvId]);

  // Save settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Track TTS speaking state
  useEffect(() => {
    tts.setCallback((speaking, msgId) => {
      setSpeakingMessageId(speaking ? msgId || null : null);
    });
  }, []);

  // Find active conversation
  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const currentMessages = activeConversation ? activeConversation.messages : [];

  // Active persona
  const activePersona =
    SYSTEM_PERSONAS.find((p) => p.id === settings.activePersonaId) ||
    SYSTEM_PERSONAS[0];

  // Auto-scroll on new messages or streaming chunk
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [currentMessages.length, isStreaming]);

  // Handle scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  };

  // Generate Smart Title via server endpoint
  const generateTitleForConversation = async (convId: string, promptText: string) => {
    try {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: data.title } : c))
          );
        }
      }
    } catch (e) {
      console.error("Auto title generation failed:", e);
    }
  };

  // Main Send Message Handler
  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = []
  ) => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;

    let convId = activeConvId;
    let isNewConv = false;

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // If no active conversation exists, create one
    if (!convId || !conversations.some((c) => c.id === convId)) {
      isNewConv = true;
      convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        title: content.slice(0, 32) || "New Conversation",
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: selectedModel,
        systemPrompt: settings.customSystemPrompt || activePersona.systemPrompt,
        temperature: settings.temperature,
        searchGrounding: settings.enableSearchGrounding,
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(convId);
    } else {
      // Append user message to existing conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, userMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    }

    // Trigger auto-titling in background if new conversation
    if (isNewConv && settings.autoTitle && content.trim()) {
      generateTitleForConversation(convId, content.trim());
    }

    // Prepare assistant streaming message
    const assistantMessageId = `msg_assistant_${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      modelUsed: selectedModel,
      isStreaming: true,
    };

    // Add placeholder assistant message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, assistantPlaceholder],
            }
          : c
      )
    );

    setIsStreaming(true);

    // Get all previous messages + current user message for context
    const currentConv = conversations.find((c) => c.id === convId);
    const historyMessages = currentConv ? [...currentConv.messages, userMessage] : [userMessage];

    // Abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: historyMessages,
          model: selectedModel,
          systemPrompt:
            settings.customSystemPrompt || activePersona.systemPrompt,
          temperature: settings.temperature,
          enableSearchGrounding: settings.enableSearchGrounding,
          thinkingLevel: settings.thinkingLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream body available.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                accumulatedText += data.chunk;
                // Live update assistant message
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === convId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === assistantMessageId
                              ? { ...m, content: accumulatedText }
                              : m
                          ),
                        }
                      : c
                  )
                );
              }
              if (data.error) {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === convId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === assistantMessageId
                              ? {
                                  ...m,
                                  isStreaming: false,
                                  error: data.error,
                                }
                              : m
                          ),
                        }
                      : c
                  )
                );
              }
              if (data.done) {
                break;
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      // Mark streaming complete
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, isStreaming: false }
                    : m
                ),
              }
            : c
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream aborted by user.");
      } else {
        console.error("Streaming error:", err);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          isStreaming: false,
                          error: err.message || "Failed to generate response.",
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    // Mark streaming false on message
    if (activeConvId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                messages: c.messages.map((m) => ({
                  ...m,
                  isStreaming: false,
                })),
              }
            : c
        )
      );
    }
  };

  // Regenerate Response
  const handleRegenerate = () => {
    if (!activeConversation || currentMessages.length === 0 || isStreaming) return;

    // Find last user message
    const lastUserMsgIndex = [...currentMessages]
      .reverse()
      .findIndex((m) => m.role === "user");

    if (lastUserMsgIndex === -1) return;

    const actualIndex = currentMessages.length - 1 - lastUserMsgIndex;
    const userMsg = currentMessages[actualIndex];

    // Remove everything after this user message
    const trimmedMessages = currentMessages.slice(0, actualIndex + 1);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: trimmedMessages,
            }
          : c
      )
    );

    // Call streaming with the user's prompt
    handleSendMessage(userMsg.content, userMsg.attachments || []);
  };

  // Edit Message
  const handleEditMessage = (msgId: string, newContent: string) => {
    if (!activeConversation || isStreaming) return;

    const msgIndex = currentMessages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    const originalMsg = currentMessages[msgIndex];
    // Slice history up to this message
    const messagesBefore = currentMessages.slice(0, msgIndex);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: messagesBefore,
            }
          : c
      )
    );

    // Re-send with updated content
    handleSendMessage(newContent, originalMsg.attachments || []);
  };

  // New Chat Handler
  const handleNewChat = () => {
    handleStopStreaming();
    tts.stop();
    setActiveConvId(null);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
    }
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Clear All
  const handleClearAll = () => {
    handleStopStreaming();
    tts.stop();
    setConversations([]);
    setActiveConvId(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-200 font-sans antialiased relative selection:bg-blue-600/30 selection:text-blue-200">
      {/* Immersive UI Ambient Glowing Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={(id) => {
          setActiveConvId(id);
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onTogglePin={handleTogglePin}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAll}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        {/* Header */}
        <Header
          currentModel={selectedModel}
          onSelectModel={setSelectedModel}
          activePersona={activePersona}
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onToggleTheme={() => {}}
        />

        {/* Chat Messages Scroll Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10"
        >
          {currentMessages.length === 0 ? (
            /* Empty State: Prompt Suggestions */
            <div className="flex-1 flex items-center justify-center my-auto">
              <PromptSuggestions
                onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              />
            </div>
          ) : (
            /* Rendered Messages */
            <div className="flex-1 pb-4">
              {currentMessages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLast={index === currentMessages.length - 1}
                  onRegenerate={handleRegenerate}
                  onEditMessage={handleEditMessage}
                  onPreviewAttachment={(att) => setLightboxAttachment(att)}
                  isSpeaking={speakingMessageId === msg.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll To Bottom Floating Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-28 right-6 z-20 p-2.5 rounded-full bg-slate-900/90 text-blue-300 border border-blue-500/30 shadow-2xl hover:bg-blue-950/80 transition-all backdrop-blur-md animate-in fade-in"
            title="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Bottom Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          setSelectedModel(newSettings.defaultModel);
        }}
      />

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        attachment={lightboxAttachment}
        onClose={() => setLightboxAttachment(null)}
      />
    </div>
  );
}
