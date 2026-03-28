import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { DropZone } from "./components/DropZone";
import { QueuePanel } from "./components/QueuePanel";
import { Settings } from "./components/Settings";
import { useConversionQueue } from "./hooks/useConversionQueue";
import { useIPCEvents } from "./hooks/useIPCEvents";
import { convertBatch, getDefaultOutputDir, getFileInfo, openFolder, loadSettings, saveSettings } from "./lib/ipc";
import type { AppSettings, BatchCompleteEvent, ConversionStatus } from "./types/conversion";
import { DEFAULT_SETTINGS } from "./types/conversion";

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

  // Safety net: reset forgeTriggered if all files are done/error/queued
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

  // Load settings on mount
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
    (id: string, status: ConversionStatus, percent: number, errorMsg?: string, outputPath?: string) => {
      updateProgress(id, status, percent, errorMsg, outputPath);
    },
    [updateProgress]
  );

  const handleBatchComplete = useCallback((event: BatchCompleteEvent) => {
    setForgeTriggered(false);
    if (event.succeeded > 0 || event.failed > 0) {
      setCompletionInfo({
        succeeded: event.succeeded,
        failed: event.failed,
        outputDir: event.outputDir,
      });
      setTimeout(() => setCompletionInfo(null), 8000);
    }
  }, []);

  useIPCEvents({ onProgress: handleProgress, onBatchComplete: handleBatchComplete });

  const handleFilesAdded = useCallback(
    async (paths: string[]) => {
      const { unsupported } = addFiles(paths);
      if (unsupported > 0) {
        setNotification(
          `${unsupported} file${unsupported > 1 ? "s" : ""} skipped (unsupported format)`
        );
        setTimeout(() => setNotification(null), 3000);
      }
      // Fetch file sizes
      try {
        const infos = await getFileInfo(paths);
        for (const info of infos) {
          updateSize(info.path, info.size);
        }
      } catch {
        // ignore file info errors
      }
    },
    [addFiles, updateSize]
  );

  const handleBrowse = useCallback(async () => {
    const selected = await open({
      multiple: true,
      title: "Select files to convert",
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
        })),
        outputDir: settings.outputDir,
        maxConcurrency: settings.maxConcurrency,
      });
    } catch (err) {
      console.error("Batch conversion failed:", err);
      setForgeTriggered(false);
    }
  }, [files, settings]);

  const handleRetry = useCallback(
    async (id: string) => {
      resetFile(id);
      const file = files.find((f) => f.id === id);
      if (file) {
        try {
          await convertBatch({
            files: [{ id: file.id, inputPath: file.path, outputFormat: file.outputFormat }],
            outputDir: settings.outputDir,
            maxConcurrency: 1,
          });
        } catch (err) {
          console.error("Retry failed:", err);
        }
      }
    },
    [resetFile, files, settings]
  );

  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+O: browse files
      if (e.metaKey && e.key === "o") {
        e.preventDefault();
        handleBrowse();
      }
      // Cmd+Enter: forge all
      if (e.metaKey && e.key === "Enter" && !isConverting) {
        e.preventDefault();
        handleConvertAll();
      }
      // Cmd+,: open settings
      if (e.metaKey && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(true);
      }
      // Escape: close settings
      if (e.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBrowse, handleConvertAll, isConverting, settingsOpen]);

  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-7">
      {/* Header */}
      <header className="flex items-center gap-4 w-full max-w-2xl mb-1 animate-fade-in">
        <div className="flex-1">
          {/* Title with ember glow */}
          <h1
            className="font-display text-[26px] font-bold tracking-tight leading-none"
            style={{
              color: "var(--color-accent)",
              textShadow: "0 0 30px rgba(212, 146, 42, 0.2), 0 0 60px rgba(212, 146, 42, 0.08)",
            }}
          >
            Simurgh Forge
          </h1>
          <p className="font-body text-[11px] text-text-muted/50 mt-1 tracking-wide">
            Universal File Converter
          </p>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 rounded-md flex items-center justify-center
                     text-text-muted/30 hover:text-accent hover:bg-accent/5
                     transition-all duration-200 border border-transparent
                     hover:border-accent-dim/20"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
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

      {/* Drop Zone */}
      <div className="mt-5 w-full flex justify-center animate-fade-in" style={{ animationDelay: "100ms" }}>
        <DropZone onFilesDropped={handleFilesAdded} fileCount={files.length} onBrowse={handleBrowse} />
      </div>

      {/* Completion Banner */}
      {completionInfo && (
        <div className="w-full max-w-2xl mt-4 animate-slide-up">
          <div className="bg-success-dim/30 border border-success/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-success">
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
              <span className="font-display text-[12px] text-success">
                {completionInfo.succeeded} file{completionInfo.succeeded !== 1 ? "s" : ""} forged
                {completionInfo.failed > 0 && (
                  <span className="text-error ml-2">{completionInfo.failed} failed</span>
                )}
              </span>
            </div>
            <button
              onClick={() => openFolder(completionInfo.outputDir)}
              className="text-[10px] font-display text-accent tracking-wider uppercase
                         border border-accent-dim/40 rounded px-2.5 py-1
                         hover:bg-accent/10 hover:border-accent/40
                         transition-all duration-200"
            >
              Open Folder
            </button>
          </div>
        </div>
      )}

      {/* Queue */}
      <QueuePanel
        files={files}
        onFormatChange={setOutputFormat}
        onRemove={removeFile}
        onRetry={handleRetry}
        onConvertAll={handleConvertAll}
        onClearQueue={clearQueue}
        isConverting={isConverting}
      />

      {/* Settings */}
      <Settings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-bg-elevated border border-accent-dim/30 rounded-lg px-4 py-2.5 shadow-lg">
            <span className="font-display text-[11px] text-accent">{notification}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
