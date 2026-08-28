import React, { useState } from "react";
import { PROMPT_SUGGESTIONS } from "../utils/constants.ts";
import { Terminal, Atom, Sparkles, Code, Cpu, Lightbulb, ArrowUpRight } from "lucide-react";

interface PromptSuggestionsProps {
  onSelectPrompt: (text: string) => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectPrompt,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", ...PROMPT_SUGGESTIONS.map((c) => c.category)];

  const getCategoryIcon = (name: string) => {
    switch (name) {
      case "Development":
        return <Code className="w-4 h-4 text-blue-400" />;
      case "Science & AI":
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case "Reasoning":
        return <Atom className="w-4 h-4 text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  const displayedPrompts = PROMPT_SUGGESTIONS.flatMap((group) => {
    if (activeCategory === "All" || group.category === activeCategory) {
      return group.prompts.map((p) => ({ ...p, category: group.category }));
    }
    return [];
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center text-center animate-in fade-in duration-300">
      {/* Immersive Neural Glowing Orb */}
      <div className="relative mb-8">
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 animate-pulse blur-md opacity-30 absolute -inset-2" />
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border border-white/20 relative bg-[#020617] flex items-center justify-center overflow-hidden shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/80 rounded-full blur-2xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/30 border-t-blue-400 animate-spin" />
          </div>
        </div>
      </div>

      <h2 className="text-3xl md:text-4xl font-light text-white mb-3 tracking-tight">
        How can I assist your <span className="italic text-blue-300 font-normal">workflow</span> today?
      </h2>
      <p className="text-slate-400 max-w-xl text-sm md:text-base mb-8 font-light leading-relaxed">
        Experience the next generation of neural reasoning. Ask me to analyze complex data, draft technical documentation, or orchestrate multi-step projects.
      </p>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            {cat !== "All" && getCategoryIcon(cat)}
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Prompt Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full text-left">
        {displayedPrompts.map((item, idx) => {
          const icon = getCategoryIcon(item.category);
          return (
            <div
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-xl backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                    {icon}
                  </div>
                  <span className="text-[10px] font-semibold text-blue-400/80 uppercase font-mono tracking-wider">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-sm text-slate-200 font-medium group-hover:text-white transition-colors mb-1.5 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center justify-end mt-4 text-slate-500 group-hover:text-blue-400 transition-colors text-xs font-medium gap-1">
                <span>Prompt</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
