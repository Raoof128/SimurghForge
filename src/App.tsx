import { useState, useCallback, useEffect } from "react";
import { DropZone } from "./components/DropZone";
import { QueuePanel } from "./components/QueuePanel";
import { Settings } from "./components/Settings";
import { useConversionQueue } from "./hooks/useConversionQueue";
import { useIPCEvents } from "./hooks/useIPCEvents";
import { convertBatch, getDefaultOutputDir } from "./lib/ipc";
import type { AppSettings, ConversionStatus } from "./types/conversion";
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
  } = useConversionQueue();

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    getDefaultOutputDir().then((dir) => {
      setSettings((prev) => ({ ...prev, outputDir: dir }));
    });
  }, []);

  const handleProgress = useCallback(
    (id: string, status: ConversionStatus, percent: number, errorMsg?: string, outputPath?: string) => {
      updateProgress(id, status, percent, errorMsg, outputPath);
    },
    [updateProgress]
  );

  const handleBatchComplete = useCallback(() => {
    setIsConverting(false);
  }, []);

  useIPCEvents({ onProgress: handleProgress, onBatchComplete: handleBatchComplete });

  const handleConvertAll = useCallback(async () => {
    const queued = files.filter((f) => f.status === "queued");
    if (queued.length === 0) return;

    setIsConverting(true);
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
      setIsConverting(false);
    }
  }, [files, settings]);

  const handleRetry = useCallback(
    (id: string) => {
      resetFile(id);
    },
    [resetFile]
  );

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
        <DropZone onFilesDropped={addFiles} fileCount={files.length} />
      </div>

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
        onSettingsChange={setSettings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
