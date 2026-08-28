import React, { useState, useRef, useEffect } from "react";
import { GeminiModelId, SystemPersona, AppSettings } from "../types.ts";
import { AVAILABLE_MODELS } from "../utils/constants.ts";
import {
  Sparkles,
  ChevronDown,
  Globe,
  Settings,
  Plus,
  PanelLeft,
  Sun,
  Moon,
  Zap,
  Check,
} from "lucide-react";

interface HeaderProps {
  currentModel: GeminiModelId;
  onSelectModel: (model: GeminiModelId) => void;
  activePersona: SystemPersona;
  settings: AppSettings;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  onSelectModel,
  activePersona,
  settings,
  onOpenSettings,
  onNewChat,
  onToggleSidebar,
  isSidebarOpen,
  onToggleTheme,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentModelInfo = AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 bg-[#020617]/70 border-b border-white/5 backdrop-blur-xl transition-all">
      {/* Left side: Sidebar toggle + Brand + Model Selector */}
      <div className="flex items-center gap-3 md:gap-5">
        <button
          id="toggle-sidebar-btn"
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer shadow-sm"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Brand Display in Header */}
        <div className="hidden sm:flex items-center gap-2.5 mr-2">
          <h1 className="text-base md:text-lg font-medium tracking-tight text-white">
            Nexus <span className="text-blue-400 font-light italic">Gemini</span>
          </h1>
        </div>

        {/* Model Selector Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            id="model-selector-btn"
            type="button"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/10 text-slate-200 transition-all cursor-pointer shadow-lg backdrop-blur-md group"
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-sm shadow-blue-400" />
            <span className="font-medium text-xs md:text-sm text-slate-100 group-hover:text-blue-200">
              {currentModelInfo.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase font-bold tracking-widest border border-blue-500/20 font-mono">
              {currentModelInfo.badge}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 transition-transform" />
          </button>

          {/* Dropdown Menu */}
          {modelDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 md:w-96 rounded-2xl bg-[#020617]/95 border border-white/10 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Select Neural Architecture
              </div>

              <div className="space-y-1 mt-1">
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = model.id === currentModel;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border border-blue-500/40 shadow-lg text-blue-100"
                          : "hover:bg-white/5 border border-transparent text-slate-300 hover:text-white"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md mt-0.5"
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">
                            {model.name}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {model.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-blue-400/90 font-mono">
                          <span>Speed: {model.speed}</span>
                          <span>•</span>
                          <span>Logic: {model.intelligence}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Status tags, New Chat, Settings */}
      <div className="flex items-center gap-2.5">
        {/* Search Grounding Indicator */}
        {settings.enableSearchGrounding && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono"
            title="Google Search grounding is active"
          >
            <Globe className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-[11px]">Live Web</span>
          </div>
        )}

        {/* Persona Chip */}
        <div
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
          title={`Active Persona: ${activePersona.name}`}
        >
          <Zap className="w-3 h-3 text-blue-400" />
          <span className="text-[11px] truncate max-w-[110px]">
            {activePersona.name}
          </span>
        </div>

        {/* New Chat Button */}
        <button
          id="header-new-chat-btn"
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          title="Start fresh conversation"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Settings button */}
        <button
          id="header-settings-btn"
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          title="Nexus System Configuration"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
