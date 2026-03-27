import type { FileItem } from "../types/conversion";
import { FileCard } from "./FileCard";

interface QueuePanelProps {
  files: FileItem[];
  onFormatChange: (id: string, format: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onConvertAll: () => void;
  onClearQueue: () => void;
  isConverting: boolean;
}

export function QueuePanel({
  files,
  onFormatChange,
  onRemove,
  onRetry,
  onConvertAll,
  onClearQueue,
  isConverting,
}: QueuePanelProps) {
  if (files.length === 0) return null;

  const hasQueuedFiles = files.some((f) => f.status === "queued");

  return (
    <div className="w-full max-w-2xl mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm text-text-muted">
          Queue ({files.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onClearQueue}
            disabled={isConverting}
            className="text-xs text-text-muted hover:text-error transition-colors font-display
                       disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1"
          >
            Clear
          </button>
          <button
            onClick={onConvertAll}
            disabled={!hasQueuedFiles || isConverting}
            className="bg-accent text-bg-base text-xs font-display font-bold rounded px-4 py-1.5
                       hover:bg-accent/90 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConverting ? "Forging..." : "Forge All"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onFormatChange={onFormatChange}
            onRemove={onRemove}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  );
}
