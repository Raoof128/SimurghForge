import { useState } from "react";
import type { FileItem, ConversionOptions } from "../types/conversion";
import { interpolate, t, tFileStatus } from "../i18n/strings";
import { ProgressBar } from "./ProgressBar";
import { FormatSelector } from "./FormatSelector";
import { QualityControls } from "./QualityControls";
import { openFile } from "../lib/ipc";

interface FileCardProps {
  file: FileItem;
  onFormatChange: (id: string, format: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onOptionsChange: (id: string, options: ConversionOptions) => void;
  index: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return interpolate(t("fileSizeB"), { n: bytes });
  if (bytes < 1024 * 1024) return interpolate(t("fileSizeKb"), { n: (bytes / 1024).toFixed(1) });
  return interpolate(t("fileSizeMb"), { n: (bytes / (1024 * 1024)).toFixed(1) });
}

function getExtensionColor(ext: string): string {
  const imageExts = ["png", "jpg", "jpeg", "heic", "svg", "webp", "tiff", "bmp", "avif"];
  const videoExts = ["mp4", "mov", "webm", "avi", "gif"];
  const audioExts = ["mp3", "wav", "flac", "ogg", "aac", "m4a"];
  const dataExts = ["csv", "xlsx", "json", "parquet", "tsv"];

  if (imageExts.includes(ext)) return "#A78BFA";
  if (videoExts.includes(ext)) return "#F472B6";
  if (audioExts.includes(ext)) return "#34D399";
  if (dataExts.includes(ext)) return "#60A5FA";
  return "#D4922A";
}

export function FileCard({
  file,
  onFormatChange,
  onRemove,
  onRetry,
  onOptionsChange,
  index,
}: FileCardProps) {
  const [showQuality, setShowQuality] = useState(false);
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

  const ariaLabel = interpolate(t("fileCardAriaGroup"), {
    name: file.name,
    status: tFileStatus(file.status),
  });

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`animate-slide-up group relative bg-bg-surface/80 backdrop-blur-sm border rounded-lg transition-all duration-300 ${cardClass}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {isConverting && (
        <div className="absolute inset-0 rounded-lg pointer-events-none" aria-hidden>
          <div className="absolute inset-0 forge-shimmer" />
        </div>
      )}

      <div className="relative p-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-display font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${extColor}15`,
              color: extColor,
              border: `1px solid ${extColor}25`,
            }}
            aria-hidden
          >
            {file.inputFormat.slice(0, 4)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-[13px] text-text-primary truncate leading-tight">
              {file.name}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5 font-body">
              {file.size > 0 ? formatFileSize(file.size) : file.inputFormat.toUpperCase()}
            </p>
          </div>

          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="flex-shrink-0 text-text-muted/40"
            aria-hidden
          >
            <path
              d="M3 8h10M10 5l3 3-3 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <FormatSelector
            filename={file.name}
            selectedFormat={file.outputFormat}
            onFormatChange={(fmt) => onFormatChange(file.id, fmt)}
            disabled={!isQueued && !isError}
          />

          {isQueued && (
            <button
              type="button"
              onClick={() => setShowQuality(!showQuality)}
              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center
                         transition-all duration-200
                         ${showQuality ? "text-accent bg-accent/10" : "text-text-muted/40 hover:text-accent hover:bg-accent/5"}
                         opacity-0 group-hover:opacity-100 focus:opacity-100
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40`}
              title={t("fileCardQualitySettings")}
              aria-expanded={showQuality}
              aria-label={t("fileCardQualitySettings")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path
                  d="M2 3h8M2 6h8M2 9h8"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <circle cx="4" cy="3" r="1" fill="currentColor" />
                <circle cx="8" cy="6" r="1" fill="currentColor" />
                <circle cx="5" cy="9" r="1" fill="currentColor" />
              </svg>
            </button>
          )}

          {isQueued && (
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center
                         text-text-muted/40 hover:text-error hover:bg-error/10
                         opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label={t("fileCardRemove")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path
                  d="M3 3l6 6M9 3l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {showQuality && isQueued && (
          <QualityControls
            options={file.options}
            outputFormat={file.outputFormat}
            onChange={(opts) => onOptionsChange(file.id, opts)}
            disabled={!isQueued}
          />
        )}

        {isConverting && (
          <div className="mt-3">
            <ProgressBar percent={file.percent} isActive={true} />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-display text-accent tracking-wider">
                {t("fileCardForging")}
              </span>
              <span className="text-[11px] font-display text-accent-bright tabular-nums">
                {file.percent}%
              </span>
            </div>
          </div>
        )}

        {isDone && (
          <div className="mt-2.5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-success flex-shrink-0" aria-hidden>
              <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M4.5 7l2 2 3.5-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[11px] font-display text-success truncate flex-1">
              {file.outputPath?.split("/").pop() ?? t("fileCardComplete")}
            </span>
            {file.outputPath && (
              <button
                type="button"
                onClick={() => openFile(file.outputPath!)}
                className="flex-shrink-0 flex items-center gap-1 text-[10px] font-display text-accent tracking-wider uppercase
                           border border-accent-dim/40 rounded px-2 py-0.5
                           hover:bg-accent/10 hover:border-accent/40
                           transition-all duration-200
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                aria-label={interpolate(t("ariaOpenConvertedFile"), {
                  name: file.outputPath.split("/").pop() ?? "",
                })}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" className="opacity-70" aria-hidden>
                  <path
                    d="M10 1H6.5M10 1v3.5M10 1L5.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 7v3a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                {t("fileCardOpen")}
              </button>
            )}
          </div>
        )}

        {isError && (
          <div className="mt-2.5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-error flex-shrink-0" aria-hidden>
              <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M5 5l4 4M9 5l-4 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[11px] text-error/80 flex-1 truncate font-body">
              {file.errorMsg ?? t("conversionFailedDefault")}
            </span>
            <button
              type="button"
              onClick={() => onRetry(file.id)}
              className="flex-shrink-0 text-[10px] font-display text-accent tracking-wider
                         border border-accent-dim/40 rounded px-2 py-0.5
                         hover:bg-accent/10 hover:border-accent/40
                         transition-all duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {t("fileCardRetry")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
