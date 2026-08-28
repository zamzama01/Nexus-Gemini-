import React, { useState, useEffect } from "react";
import { AppSettings, GeminiModelId, ThinkingLevel, AppTheme } from "../types.ts";
import { SYSTEM_PERSONAS, AVAILABLE_MODELS, DEFAULT_SETTINGS } from "../utils/constants.ts";
import {
  X,
  Sliders,
  Sparkles,
  Bot,
  Brain,
  Globe,
  RotateCcw,
  Check,
  Palette,
  Key,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handlePersonaSelect = (personaId: string) => {
    const persona = SYSTEM_PERSONAS.find((p) => p.id === personaId);
    if (persona) {
      setFormData((prev) => ({
        ...prev,
        activePersonaId: persona.id,
        customSystemPrompt: persona.systemPrompt,
        defaultModel: persona.recommendedModel,
        temperature: persona.recommendedTemp,
      }));
    }
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#020617] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm md:text-base text-white">
                Nexus AI Configuration & Settings
              </h2>
              <p className="text-xs text-slate-400">
                Tune model intelligence, system instructions & neural parameters
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm">
          {/* Persona Presets */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-300 uppercase tracking-wider text-[11px] font-mono">
              Intelligence Persona Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SYSTEM_PERSONAS.map((p) => {
                const isSelected = formData.activePersonaId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePersonaSelect(p.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10 text-blue-100"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-white/[0.07]"
                    }`}
                  >
                    <Bot className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center justify-between">
                        <span>{p.name}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom System Instruction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] font-mono">
                System Instructions
              </label>
              <span className="text-[11px] text-slate-500">
                Customizes Gemini behavior
              </span>
            </div>
            <textarea
              value={formData.customSystemPrompt}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customSystemPrompt: e.target.value,
                  activePersonaId: "custom",
                }))
              }
              rows={3}
              placeholder="Enter custom instructions for how Gemini should respond..."
              className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-sans leading-relaxed"
            />
          </div>

          {/* Model & Thinking Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Model */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] font-mono">
                Default Neural Model
              </label>
              <select
                value={formData.defaultModel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultModel: e.target.value as GeminiModelId,
                  }))
                }
                className="w-full py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 font-sans cursor-pointer"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#020617] text-white">
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Thinking Level (Gemini 3 series) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                <span>Thinking Reasoning Level</span>
              </label>
              <select
                value={formData.thinkingLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thinkingLevel: e.target.value as ThinkingLevel,
                  }))
                }
                className="w-full py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 font-sans cursor-pointer"
              >
                <option value="default" className="bg-[#020617] text-white">Default (Autonomous Adaptive)</option>
                <option value="low" className="bg-[#020617] text-white">Low (Faster response, minimal delay)</option>
                <option value="high" className="bg-[#020617] text-white">High (Deep reasoning for math/code)</option>
              </select>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2.5 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-200 text-xs">
                Temperature (Creativity vs Determinism)
              </label>
              <span className="font-mono text-blue-400 font-semibold text-xs">
                {formData.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={formData.temperature}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  temperature: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>0.0 (Precise / Factual)</span>
              <span>0.7 (Balanced)</span>
              <span>1.5 (Creative / Novel)</span>
            </div>
          </div>

          {/* Live Search Grounding Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-xs text-white">
                  Google Search Grounding
                </p>
                <p className="text-[11px] text-slate-400">
                  Ground responses with real-time live web facts
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="search-grounding-toggle"
              checked={formData.enableSearchGrounding}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  enableSearchGrounding: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
            />
          </div>

          {/* Custom API Key (for GitHub Pages / Static Hosting) */}
          <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>Custom Gemini API Key</span>
              </label>
              <span className="text-[10px] text-blue-400 font-mono">Optional / Static Host</span>
            </div>
            <div className="relative">
              <input
                id="custom-api-key-input"
                type={showApiKey ? "text" : "password"}
                value={formData.customApiKey || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customApiKey: e.target.value.trim(),
                  }))
                }
                placeholder="AIzaSy... (leave blank to use server environment key)"
                className="w-full py-2.5 pl-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title={showApiKey ? "Hide key" : "Show key"}
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-slate-400 leading-relaxed pt-1">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                Required when deployed to <strong>GitHub Pages</strong> or pure static hosts where no backend server is running. Stored locally in your browser.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-settings-btn"
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
