import { useState, useEffect } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

interface DropZoneProps {
  onFilesDropped: (paths: string[]) => void;
  fileCount: number;
  onBrowse: () => void;
}

export function DropZone({ onFilesDropped, fileCount, onBrowse }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setIsDragging(true);
        } else if (event.payload.type === "drop") {
          setIsDragging(false);
          onFilesDropped(event.payload.paths);
        } else {
          setIsDragging(false);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, [onFilesDropped]);

  if (fileCount > 0) {
    return (
      <div className="w-full max-w-2xl">
        <div
          className={`relative border border-dashed rounded-lg py-3 px-5 transition-all duration-500 flex items-center justify-between ${
            isDragging
              ? "border-accent/60 bg-accent/[0.03]"
              : "border-text-muted/12 hover:border-accent-dim/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 40 40" className={`${isDragging ? "text-accent" : "text-text-muted/40"}`}>
              <path d="M8 28h24M12 28v-4a2 2 0 012-2h12a2 2 0 012 2v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className={`font-display text-[12px] ${isDragging ? "text-accent" : "text-text-muted/50"}`}>
              {isDragging ? "Release to add more" : "Drop more files here"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-[10px] font-display font-medium tracking-wider uppercase rounded-full px-2.5 py-0.5 border border-accent/15">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {fileCount}
            </span>
            <button
              onClick={onBrowse}
              className="text-[10px] font-display text-text-muted/50 tracking-wider uppercase
                         hover:text-accent transition-all duration-200 px-2 py-1
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Browse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full max-w-2xl rounded-xl transition-all duration-500 cursor-default overflow-hidden ${
        isDragging ? "animate-forge-glow" : ""
      }`}
    >
      {/* Outer border glow layer */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-500 ${
          isDragging
            ? "bg-gradient-to-b from-accent/8 via-transparent to-ember/5"
            : ""
        }`}
      />

      {/* Main drop area */}
      <div
        className={`relative border-2 border-dashed rounded-xl py-10 px-8 text-center transition-all duration-500 ${
          isDragging
            ? "border-accent/60 bg-accent/[0.03]"
            : "border-text-muted/12 hover:border-accent-dim/30"
        }`}
      >
        {/* Forge icon */}
        <div className="flex flex-col items-center gap-3">
          <div className={`transition-all duration-500 ${isDragging ? "scale-110" : ""}`}>
            {isDragging ? (
              /* Active: flame icon */
              <svg width="40" height="40" viewBox="0 0 40 40" className="text-accent">
                <path
                  d="M20 4c0 0-8 10-8 20a8 8 0 0016 0C28 14 20 4 20 4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-ember-pulse"
                  style={{ animation: "ember-pulse 1.2s ease-in-out infinite" }}
                />
                <path
                  d="M20 16c0 0-3 4-3 8a3 3 0 006 0c0-4-3-8-3-8z"
                  fill="currentColor"
                  opacity="0.3"
                />
              </svg>
            ) : (
              /* Idle: anvil/forge icon */
              <svg width="40" height="40" viewBox="0 0 40 40" className="text-text-muted/40">
                <path
                  d="M8 28h24M12 28v-4a2 2 0 012-2h12a2 2 0 012 2v4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M16 22v-6M24 22v-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <path
                  d="M20 8v4M16 10h8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>

          <div>
            <p
              className={`font-display text-sm tracking-wide transition-all duration-500 ${
                isDragging ? "text-accent" : "text-text-muted/60"
              }`}
            >
              {isDragging ? "Release to forge" : "Drop files here to begin"}
            </p>
            <p className="text-[10px] text-text-muted/30 mt-1 font-body">
              Images, documents, audio, video, data
            </p>
          </div>

          <button
            onClick={onBrowse}
            className="mt-3 text-[11px] font-display text-accent/70 tracking-wider uppercase
                       border border-accent-dim/30 rounded-md px-4 py-1.5
                       hover:bg-accent/5 hover:border-accent/40 hover:text-accent
                       transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Browse Files
          </button>
        </div>
      </div>
    </div>
  );
}
