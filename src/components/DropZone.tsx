import { useState, useEffect } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

interface DropZoneProps {
  onFilesDropped: (paths: string[]) => void;
  fileCount: number;
}

export function DropZone({ onFilesDropped, fileCount }: DropZoneProps) {
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

  return (
    <div
      className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-default ${
        isDragging
          ? "border-accent bg-bg-elevated shadow-[0_0_24px_var(--color-accent-dim)]"
          : "border-text-muted/30 hover:border-accent-dim"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className={`text-4xl transition-colors ${isDragging ? "text-accent" : "text-text-muted"}`}>
          {isDragging ? "\u2B07" : "\u2693"}
        </span>
        <p className={`font-display text-sm ${isDragging ? "text-accent" : "text-text-muted"}`}>
          {isDragging ? "Release to forge" : "Drop files here"}
        </p>
        {fileCount > 0 && (
          <span className="bg-accent text-bg-base text-xs font-display font-bold rounded-full px-2 py-0.5 mt-1">
            {fileCount} file{fileCount !== 1 ? "s" : ""} queued
          </span>
        )}
      </div>
    </div>
  );
}
