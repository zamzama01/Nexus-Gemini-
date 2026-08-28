import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="my-5 rounded-2xl border border-white/10 bg-[#020617]/95 shadow-2xl overflow-hidden text-xs md:text-sm font-mono backdrop-blur-xl">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.03] text-slate-300 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-300">
            {language || "code"}
          </span>
        </div>
        <button
          id={`copy-code-${language || "snippet"}`}
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all text-xs cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono">
        <pre className="!m-0 !p-0">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content text-slate-200 text-[14.5px] leading-7 font-light">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");
            
            if (isInline) {
              return (
                <code
                  className="px-2 py-0.5 mx-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[13px]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] : ""}
                value={String(children).replace(/\n$/, "")}
              />
            );
          },
          p({ children }) {
            return <p className="mb-3.5 last:mb-0 text-slate-300 font-normal leading-relaxed">{children}</p>;
          },
          h1({ children }) {
            return (
              <h1 className="text-xl md:text-2xl font-light tracking-tight text-white mt-6 mb-3 pb-2 border-b border-white/10">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg md:text-xl font-light tracking-tight text-blue-300 mt-5 mb-2.5">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base font-medium text-slate-100 mt-4 mb-2">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-3 space-y-1.5 text-slate-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-3 space-y-1.5 text-slate-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 pl-4 border-l-2 border-blue-500/80 italic text-blue-100/90 bg-blue-500/5 py-1 rounded-r-md">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                <table className="w-full text-left text-sm border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-white/5 text-blue-300 border-b border-white/10">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 border-t border-white/5 text-slate-300">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-500/40 hover:decoration-blue-400 transition-colors font-medium"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-6 border-white/10" />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
