import React from "react";
import { X, Download } from "lucide-react";
import { Attachment } from "../types.ts";

interface ImageLightboxModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  attachment,
  onClose,
}) => {
  if (!attachment) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = attachment.previewUrl;
    a.download = attachment.name || "nexus-attachment";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Container */}
      <div className="relative z-10 max-w-4xl max-h-[90vh] flex flex-col items-center bg-[#020617] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/5 text-slate-300">
          <span className="text-xs font-mono text-blue-300 truncate max-w-xs md:max-w-md">
            {attachment.name}
          </span>
          <div className="flex items-center gap-2">
            <button
              id="download-lightbox-btn"
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              id="close-lightbox-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/60 text-slate-300 hover:text-red-400 border border-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="p-4 max-h-[80vh] overflow-auto flex items-center justify-center">
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            referrerPolicy="no-referrer"
            className="max-h-[75vh] w-auto object-contain rounded-xl border border-white/10 shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
