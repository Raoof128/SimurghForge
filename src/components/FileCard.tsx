import type { FileItem } from "../types/conversion";
import { ProgressBar } from "./ProgressBar";
import { FormatSelector } from "./FormatSelector";

interface FileCardProps {
  file: FileItem;
  onFormatChange: (id: string, format: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  queued:     "border-text-muted/30",
  converting: "border-accent shadow-[0_0_12px_var(--color-accent-dim)]",
  done:       "border-success",
  error:      "border-error",
};

const STATUS_ICONS: Record<string, string> = {
  queued:     "\u2022",
  converting: "\u2699",
  done:       "\u2713",
  error:      "\u2717",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileCard({ file, onFormatChange, onRemove, onRetry }: FileCardProps) {
  const isConverting = file.status === "converting";
  const isDone = file.status === "done";
  const isError = file.status === "error";
  const isActive = isConverting || file.status === "queued";

  return (
    <div
      className={`bg-bg-surface border rounded-lg p-4 transition-all duration-300 ${STATUS_STYLES[file.status]}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`text-lg ${
            isDone ? "text-success" : isError ? "text-error" : isConverting ? "text-accent" : "text-text-muted"
          }`}
        >
          {STATUS_ICONS[file.status]}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-display text-sm text-text-primary truncate">
            {file.name}
          </p>
          {file.size > 0 && (
            <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
          )}
        </div>

        <span className="text-text-muted text-xs font-display">{"\u2192"}</span>

        <FormatSelector
          filename={file.name}
          selectedFormat={file.outputFormat}
          onFormatChange={(fmt) => onFormatChange(file.id, fmt)}
          disabled={!isActive && !isError}
        />

        {isActive && (
          <button
            onClick={() => onRemove(file.id)}
            className="text-text-muted hover:text-error transition-colors text-sm px-1"
            title="Remove"
          >
            {"\u2715"}
          </button>
        )}
      </div>

      {isConverting && (
        <div className="mt-2">
          <ProgressBar percent={file.percent} isActive={true} />
          <p className="text-xs text-accent mt-1 font-display">{file.percent}%</p>
        </div>
      )}

      {isDone && file.outputPath && (
        <p className="text-xs text-success mt-1 font-display truncate">
          Forged {"\u2192"} {file.outputPath.split("/").pop()}
        </p>
      )}

      {isError && (
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-error flex-1 truncate">
            {file.errorMsg ?? "Conversion failed"}
          </p>
          <button
            onClick={() => onRetry(file.id)}
            className="text-xs text-accent hover:text-text-primary border border-accent-dim rounded px-2 py-0.5 transition-colors font-display"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
