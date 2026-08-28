import React, { useState } from "react";
import { Conversation } from "../types.ts";
import { exportConversationAsMarkdown, exportConversationAsJSON } from "../utils/storage.ts";
import {
  Sparkles,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Check,
  X,
  FileDown,
  MessageSquare,
  PanelLeftClose,
  Settings,
  Flame,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onTogglePin,
  onRenameConversation,
  onClearAll,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Filter conversations by search term
  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages.some((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const pinnedConversations = filtered.filter((c) => c.isPinned);
  const recentConversations = filtered.filter((c) => !c.isPinned);

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv.id === activeConvId;
    const isEditing = conv.id === editingId;

    return (
      <div
        key={conv.id}
        id={`conv-item-${conv.id}`}
        onClick={() => {
          if (!isEditing) onSelectConversation(conv.id);
        }}
        className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-xs ${
          isActive
            ? "bg-blue-600/20 border border-blue-500/40 text-blue-100 shadow-md backdrop-blur-sm"
            : "hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-100"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
            }`}
          />

          {isEditing ? (
            <div
              className="flex items-center gap-1 flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename(conv.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
                className="w-full py-0.5 px-1.5 bg-[#020617] border border-blue-500 rounded text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={(e) => handleSaveRename(conv.id, e)}
                className="p-1 text-emerald-400 hover:bg-emerald-950/60 rounded"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleCancelRename}
                className="p-1 text-red-400 hover:bg-red-950/60 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="truncate font-medium flex-1">{conv.title}</span>
          )}
        </div>

        {/* Action icons on hover */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
            {/* Toggle Pin */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(conv.id);
              }}
              className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-white/10"
              title={conv.isPinned ? "Unpin chat" : "Pin chat"}
            >
              {conv.isPinned ? (
                <PinOff className="w-3 h-3 text-blue-400" />
              ) : (
                <Pin className="w-3 h-3" />
              )}
            </button>

            {/* Rename */}
            <button
              type="button"
              onClick={(e) => startRename(conv, e)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title="Rename title"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            {/* Export Markdown */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                exportConversationAsMarkdown(conv);
              }}
              className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-white/10"
              title="Export as Markdown"
            >
              <FileDown className="w-3 h-3" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this conversation?")) {
                  onDeleteConversation(conv.id);
                }
              }}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/50"
              title="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="nexus-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-80 flex flex-col bg-[#020617]/95 md:bg-[#020617]/80 backdrop-blur-2xl border-r border-white/10 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:hidden"
        }`}
      >
        {/* Brand / Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#020617] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white tracking-tight flex items-center gap-1.5">
                NEXUS GEMINI
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              </h2>
              <span className="text-[10px] text-blue-400 font-mono">
                Neural Interface
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 md:hidden"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: New Chat Button */}
        <div className="p-3">
          <button
            id="sidebar-new-chat-btn"
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs tracking-wide shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Start New Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500 pointer-events-none" />
            <input
              id="sidebar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full py-1.5 pl-8 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-semibold font-mono text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3 text-blue-400" />
                <span>Pinned Chats</span>
              </div>
              {pinnedConversations.map(renderConversationItem)}
            </div>
          )}

          {/* Recent Section */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-semibold font-mono text-slate-500 uppercase tracking-wider">
              {pinnedConversations.length > 0 ? "Recent Chats" : "All Conversations"}
            </div>

            {recentConversations.length === 0 && pinnedConversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                {searchQuery ? "No matching chats found." : "No saved chats yet."}
              </div>
            ) : (
              recentConversations.map(renderConversationItem)
            )}
          </div>
        </div>

        {/* Bottom Bar: Settings & Clear History */}
        <div className="p-3 border-t border-white/5 bg-[#020617]/90 flex items-center justify-between text-xs text-slate-400">
          <button
            id="sidebar-settings-btn"
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          {conversations.length > 0 && (
            <button
              id="sidebar-clear-all-btn"
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to clear all chat histories?")) {
                  onClearAll();
                }
              }}
              className="py-1.5 px-2 rounded-lg hover:bg-red-950/40 hover:text-red-400 transition-colors text-[11px]"
            >
              Clear All
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
