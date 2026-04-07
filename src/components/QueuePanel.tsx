import type { FileItem, ConversionOptions } from "../types/conversion";
import { FileCard } from "./FileCard";
import { interpolate, t } from "../i18n/strings";

interface QueuePanelProps {
  files: FileItem[];
  onFormatChange: (id: string, format: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onOptionsChange: (id: string, options: ConversionOptions) => void;
  onConvertAll: () => void;
  onClearQueue: () => void;
  isConverting: boolean;
}

export function QueuePanel({
  files,
  onFormatChange,
  onRemove,
  onRetry,
  onOptionsChange,
  onConvertAll,
  onClearQueue,
  isConverting,
}: QueuePanelProps) {
  if (files.length === 0) return null;

  const hasQueuedFiles = files.some((f) => f.status === "queued");
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const allFinished =
    files.length > 0 &&
    !isConverting &&
    files.every((f) => f.status === "done" || f.status === "error");

  return (
    <div className="w-full max-w-2xl mt-6 animate-fade-in" aria-live="polite">
      <div className="forge-separator mb-5" />

      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-[11px] text-text-muted tracking-[0.15em] uppercase">
            {t("queueHeading")}
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-display text-text-muted/60 tabular-nums">
              {files.length}
            </span>
            {doneCount > 0 && (
              <span className="text-[10px] font-display text-success tabular-nums">
                {interpolate(t("queueDone"), { count: doneCount })}
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-[10px] font-display text-error tabular-nums">
                {interpolate(t("queueFailed"), { count: errorCount })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allFinished ? (
            <button
              type="button"
              aria-label={t("ariaNewBatch")}
              onClick={onClearQueue}
              className="text-[11px] font-display font-bold tracking-wider uppercase
                         rounded-md px-5 py-2 transition-all duration-300
                         bg-bg-elevated text-text-primary border border-text-muted/20
                         hover:border-accent/40 hover:text-accent
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <span className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path
                    d="M1 6a5 5 0 019-2M11 6a5 5 0 01-9 2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 1v3h-3M2 11V8h3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("queueNewBatch")}
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                aria-label={t("ariaClearQueue")}
                onClick={onClearQueue}
                disabled={isConverting}
                className="text-[10px] font-display text-text-muted/50 tracking-wider uppercase
                           hover:text-error transition-all duration-200
                           disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded
                           hover:bg-error/5
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {t("queueClear")}
              </button>

              <button
                type="button"
                aria-label={t("ariaConvertAll")}
                onClick={onConvertAll}
                disabled={!hasQueuedFiles || isConverting}
                className={`relative text-[11px] font-display font-bold tracking-wider uppercase
                           rounded-md px-5 py-2 transition-all duration-300
                           disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                           ${
                             isConverting
                               ? "bg-accent/20 text-accent border border-accent/30"
                               : "bg-gradient-to-b from-accent to-accent-dim text-bg-base border border-accent/20 hover:from-accent-bright hover:to-accent animate-btn-forge"
                           }`}
              >
                {isConverting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      className="animate-spin"
                      aria-hidden
                    >
                      <circle
                        cx="6"
                        cy="6"
                        r="4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="14 14"
                        strokeLinecap="round"
                      />
                    </svg>
                    {t("queueForging")}
                  </span>
                ) : (
                  t("queueForgeAll")
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1 pb-2">
        {files.map((file, i) => (
          <FileCard
            key={file.id}
            file={file}
            onFormatChange={onFormatChange}
            onRemove={onRemove}
            onRetry={onRetry}
            onOptionsChange={onOptionsChange}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
