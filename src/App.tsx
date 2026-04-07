import { useCallback, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { DropZone } from "./components/DropZone";
import { QueuePanel } from "./components/QueuePanel";
import { Settings } from "./components/Settings";
import { useConversionQueue } from "./hooks/useConversionQueue";
import { useIPCEvents } from "./hooks/useIPCEvents";
import {
  interpolate,
  t,
  tCompletionForged,
  tNotificationSkipped,
} from "./i18n/strings";
import {
  convertBatch,
  getDefaultOutputDir,
  getFileInfo,
  openFolder,
  loadSettings,
  saveSettings,
} from "./lib/ipc";
import type { AppSettings, BatchCompleteEvent, ConversionStatus } from "./types/conversion";
import { DEFAULT_SETTINGS } from "./types/conversion";

function isModifierShortcut(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

function App() {
  const {
    files,
    addFiles,
    removeFile,
    clearQueue,
    setOutputFormat,
    updateProgress,
    resetFile,
    updateSize,
    setOptions,
  } = useConversionQueue();

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forgeTriggered, setForgeTriggered] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [completionInfo, setCompletionInfo] = useState<{
    succeeded: number;
    failed: number;
    outputDir: string;
  } | null>(null);

  const anyConverting = files.some((f) => f.status === "converting");
  const isConverting = forgeTriggered || anyConverting;

  useEffect(() => {
    if (
      forgeTriggered &&
      files.length > 0 &&
      files.every((f) => f.status === "done" || f.status === "error" || f.status === "queued")
    ) {
      const timer = setTimeout(() => setForgeTriggered(false), 500);
      return () => clearTimeout(timer);
    }
  }, [files, forgeTriggered]);

  useEffect(() => {
    Promise.all([getDefaultOutputDir(), loadSettings()]).then(([defaultDir, saved]) => {
      setSettings({
        outputDir: saved.outputDir || defaultDir,
        maxFileSize: saved.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
        maxConcurrency: saved.maxConcurrency ?? DEFAULT_SETTINGS.maxConcurrency,
      });
    });
  }, []);

  const handleProgress = useCallback(
    (
      id: string,
      status: ConversionStatus,
      percent: number,
      errorMsg?: string,
      outputPath?: string,
    ) => {
      updateProgress(id, status, percent, errorMsg, outputPath);
    },
    [updateProgress],
  );

  const handleBatchComplete = useCallback((event: BatchCompleteEvent) => {
    setForgeTriggered(false);
    if (
      event.totalFiles > 0 &&
      (event.succeeded > 0 || event.failed > 0)
    ) {
      setCompletionInfo({
        succeeded: event.succeeded,
        failed: event.failed,
        outputDir: event.outputDir,
      });
    }
  }, []);

  useIPCEvents({ onProgress: handleProgress, onBatchComplete: handleBatchComplete });

  const handleFilesAdded = useCallback(
    async (paths: string[]) => {
      const { unsupported } = addFiles(paths);
      if (unsupported > 0) {
        setNotification(tNotificationSkipped(unsupported));
        setTimeout(() => setNotification(null), 3000);
      }
      try {
        const infos = await getFileInfo(paths);
        for (const info of infos) {
          updateSize(info.path, info.size);
        }
      } catch {
        // ignore file info errors
      }
    },
    [addFiles, updateSize],
  );

  const handleBrowse = useCallback(async () => {
    const selected = await open({
      multiple: true,
      title: t("dialogSelectFilesTitle"),
    });
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      handleFilesAdded(paths);
    }
  }, [handleFilesAdded]);

  const handleConvertAll = useCallback(async () => {
    const queued = files.filter((f) => f.status === "queued");
    if (queued.length === 0) return;

    setForgeTriggered(true);
    try {
      await convertBatch({
        files: queued.map((f) => ({
          id: f.id,
          inputPath: f.path,
          outputFormat: f.outputFormat,
          options: f.options,
        })),
        outputDir: settings.outputDir,
        maxConcurrency: settings.maxConcurrency,
        maxInputFileBytes: settings.maxFileSize,
      });
    } catch (err) {
      console.error("Batch conversion failed:", err);
      setForgeTriggered(false);
    }
  }, [files, settings]);

  const handleRetry = useCallback(
    async (id: string) => {
      const snapshot = files.find((f) => f.id === id);
      if (!snapshot) return;
      resetFile(id);
      try {
        await convertBatch({
          files: [
            {
              id: snapshot.id,
              inputPath: snapshot.path,
              outputFormat: snapshot.outputFormat,
              options: snapshot.options,
            },
          ],
          outputDir: settings.outputDir,
          maxConcurrency: 1,
          maxInputFileBytes: settings.maxFileSize,
        });
      } catch (err) {
        console.error("Retry failed:", err);
      }
    },
    [files, resetFile, settings],
  );

  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModifierShortcut(e) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleBrowse();
      }
      if (isModifierShortcut(e) && e.key === "Enter" && !isConverting) {
        e.preventDefault();
        handleConvertAll();
      }
      if (isModifierShortcut(e) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(true);
      }
      if (e.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBrowse, handleConvertAll, isConverting, settingsOpen]);

  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-7">
      <header className="flex items-center gap-4 w-full max-w-2xl mb-1 animate-fade-in">
        <div className="flex-1">
          <h1
            className="font-display text-[26px] font-bold tracking-tight leading-none"
            style={{
              color: "var(--color-accent)",
              textShadow: "0 0 30px rgba(232, 163, 62, 0.25), 0 0 60px rgba(232, 163, 62, 0.1)",
            }}
          >
            {t("appTitle")}
          </h1>
          <p className="font-body text-[11px] text-text-muted/50 mt-1 tracking-wide">
            {t("appSubtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 rounded-md flex items-center justify-center
                     text-text-muted/30 hover:text-accent hover:bg-accent/5
                     transition-all duration-200 border border-transparent
                     hover:border-accent-dim/20
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={t("ariaSettingsButton")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div
        className="mt-5 w-full flex justify-center animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <DropZone
          onFilesDropped={handleFilesAdded}
          fileCount={files.length}
          onBrowse={handleBrowse}
        />
      </div>

      {completionInfo && (
        <div className="w-full max-w-2xl mt-4 animate-slide-up" role="status" aria-live="polite">
          <div className="bg-success-dim/30 border border-success/20 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-success flex-shrink-0" aria-hidden>
                <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path
                  d="M5 8l2.5 2.5L11 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-display text-[12px] text-success min-w-0">
                {tCompletionForged(completionInfo.succeeded)}
                {completionInfo.failed > 0 && (
                  <span className="text-error ml-2">
                    {interpolate(t("completionFailedInline"), { count: completionInfo.failed })}
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => openFolder(completionInfo.outputDir)}
              className="text-[10px] font-display text-accent tracking-wider uppercase shrink-0
                         border border-accent-dim/40 rounded px-2.5 py-1
                         hover:bg-accent/10 hover:border-accent/40
                         transition-all duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {t("completionOpenFolder")}
            </button>
          </div>
        </div>
      )}

      <QueuePanel
        files={files}
        onFormatChange={setOutputFormat}
        onRemove={removeFile}
        onRetry={handleRetry}
        onOptionsChange={setOptions}
        onConvertAll={handleConvertAll}
        onClearQueue={() => {
          clearQueue();
          setCompletionInfo(null);
        }}
        isConverting={isConverting}
      />

      <Settings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {notification && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
          role="status"
          aria-live="polite"
          aria-label={t("ariaToastNotification")}
        >
          <div className="bg-bg-elevated border border-accent-dim/30 rounded-lg px-4 py-2.5 shadow-lg max-w-[min(90vw,28rem)]">
            <span className="font-display text-[11px] text-accent">{notification}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
