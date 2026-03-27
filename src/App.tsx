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
    <div className="flex flex-col items-center min-h-screen bg-bg-base px-6 py-8">
      <div className="flex items-center gap-4 mb-1 w-full max-w-2xl">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-accent tracking-tight">
            Simurgh Forge
          </h1>
          <p className="font-body text-text-muted text-sm">
            Universal File Converter
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-text-muted hover:text-accent transition-colors font-display text-lg"
          title="Settings"
        >
          {"\u2699"}
        </button>
      </div>

      <div className="mt-6 w-full flex justify-center">
        <DropZone onFilesDropped={addFiles} fileCount={files.length} />
      </div>

      <QueuePanel
        files={files}
        onFormatChange={setOutputFormat}
        onRemove={removeFile}
        onRetry={handleRetry}
        onConvertAll={handleConvertAll}
        onClearQueue={clearQueue}
        isConverting={isConverting}
      />

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
