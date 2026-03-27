import type { AppSettings } from "../types/conversion";

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ settings, onSettingsChange, isOpen, onClose }: SettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-80 bg-bg-surface border-l border-accent-dim h-full p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg text-accent">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            {"\u2715"}
          </button>
        </div>

        <div className="mb-6">
          <label className="block font-display text-xs text-text-muted mb-2">
            Output Directory
          </label>
          <input
            type="text"
            value={settings.outputDir}
            onChange={(e) =>
              onSettingsChange({ ...settings, outputDir: e.target.value })
            }
            className="w-full bg-bg-elevated text-text-primary border border-accent-dim rounded px-3 py-2 text-xs font-display
                       focus:outline-none focus:border-accent"
            placeholder="~/Downloads/SimurghForge/"
          />
        </div>

        <div className="mb-6">
          <label className="block font-display text-xs text-text-muted mb-2">
            Max File Size: {Math.round(settings.maxFileSize / (1024 * 1024))}MB
          </label>
          <input
            type="range"
            min={10 * 1024 * 1024}
            max={2000 * 1024 * 1024}
            step={10 * 1024 * 1024}
            value={settings.maxFileSize}
            onChange={(e) =>
              onSettingsChange({ ...settings, maxFileSize: Number(e.target.value) })
            }
            className="w-full accent-accent"
          />
        </div>

        <div className="mb-6">
          <label className="block font-display text-xs text-text-muted mb-2">
            Concurrent Conversions: {settings.maxConcurrency}
          </label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={settings.maxConcurrency}
            onChange={(e) =>
              onSettingsChange({ ...settings, maxConcurrency: Number(e.target.value) })
            }
            className="w-full accent-accent"
          />
        </div>
      </div>
    </div>
  );
}
