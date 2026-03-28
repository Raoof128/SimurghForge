import type { FileItem } from "../types/conversion";
import { ProgressBar } from "./ProgressBar";
import { FormatSelector } from "./FormatSelector";

interface FileCardProps {
  file: FileItem;
  onFormatChange: (id: string, format: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  index: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtensionColor(ext: string): string {
  const imageExts = ["png", "jpg", "jpeg", "heic", "svg", "webp", "tiff", "bmp", "avif"];
  const videoExts = ["mp4", "mov", "webm", "avi", "gif"];
  const audioExts = ["mp3", "wav", "flac", "ogg", "aac", "m4a"];
  const dataExts = ["csv", "xlsx", "json", "parquet", "tsv"];

  if (imageExts.includes(ext)) return "#A78BFA"; // violet
  if (videoExts.includes(ext)) return "#F472B6"; // pink
  if (audioExts.includes(ext)) return "#34D399"; // emerald
  if (dataExts.includes(ext)) return "#60A5FA"; // blue
  return "#D4922A"; // default amber for documents
}

export function FileCard({ file, onFormatChange, onRemove, onRetry, index }: FileCardProps) {
  const isConverting = file.status === "converting";
  const isDone = file.status === "done";
  const isError = file.status === "error";
  const isQueued = file.status === "queued";
  const extColor = getExtensionColor(file.inputFormat);

  const cardClass = isConverting
    ? "border-accent/60 animate-heat-border"
    : isDone
      ? "border-success/40 bg-success-dim/20 hover:border-success/60"
      : isError
        ? "border-error/40 bg-error-dim/20 hover:border-error/60"
        : "border-text-muted/10 hover:border-accent-dim/40";

  return (
    <div
      role="group"
      aria-label={`File: ${file.name}, Status: ${file.status}`}
      className={`animate-slide-up group relative bg-bg-surface/80 backdrop-blur-sm border rounded-lg transition-all duration-300 ${cardClass}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Forge heat shimmer overlay during conversion */}
      {isConverting && (
        <div className="absolute inset-0 rounded-lg pointer-events-none">
          <div className="absolute inset-0 forge-shimmer" />
        </div>
      )}

      <div className="relative p-3.5">
        {/* Top row: extension badge, filename, arrow, format selector, remove */}
        <div className="flex items-center gap-2.5">
          {/* Extension badge */}
          <div
            className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-display font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${extColor}15`,
              color: extColor,
              border: `1px solid ${extColor}25`,
            }}
          >
            {file.inputFormat.slice(0, 4)}
          </div>

          {/* Filename + size */}
          <div className="flex-1 min-w-0">
            <p className="font-display text-[13px] text-text-primary truncate leading-tight">
              {file.name}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5 font-body">
              {file.size > 0 ? formatFileSize(file.size) : file.inputFormat.toUpperCase()}
            </p>
          </div>

          {/* Arrow */}
          <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0 text-text-muted/40">
            <path d="M3 8h10M10 5l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Format selector */}
          <FormatSelector
            filename={file.name}
            selectedFormat={file.outputFormat}
            onFormatChange={(fmt) => onFormatChange(file.id, fmt)}
            disabled={!isQueued && !isError}
          />

          {/* Remove button */}
          {isQueued && (
            <button
              onClick={() => onRemove(file.id)}
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center
                         text-text-muted/40 hover:text-error hover:bg-error/10
                         opacity-0 group-hover:opacity-100 transition-all duration-200"
              title="Remove"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar during conversion */}
        {isConverting && (
          <div className="mt-3">
            <ProgressBar percent={file.percent} isActive={true} />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-display text-accent tracking-wider">
                FORGING
              </span>
              <span className="text-[11px] font-display text-accent-bright tabular-nums">
                {file.percent}%
              </span>
            </div>
          </div>
        )}

        {/* Done state */}
        {isDone && (
          <div className="mt-2.5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-success flex-shrink-0">
              <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4.5 7l2 2 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-display text-success truncate">
              {file.outputPath?.split("/").pop() ?? "Complete"}
            </span>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="mt-2.5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-error flex-shrink-0">
              <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] text-error/80 flex-1 truncate font-body">
              {file.errorMsg ?? "Conversion failed"}
            </span>
            <button
              onClick={() => onRetry(file.id)}
              className="flex-shrink-0 text-[10px] font-display text-accent tracking-wider
                         border border-accent-dim/40 rounded px-2 py-0.5
                         hover:bg-accent/10 hover:border-accent/40
                         transition-all duration-200"
            >
              RETRY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
