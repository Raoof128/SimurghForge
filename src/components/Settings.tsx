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
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="animate-slide-in-right relative w-80 bg-bg-surface/95 backdrop-blur-xl border-l border-accent-dim/20 h-full overflow-y-auto">
        {/* Header with accent line */}
        <div className="sticky top-0 bg-bg-surface/95 backdrop-blur-xl z-10">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="font-display text-[13px] text-accent tracking-[0.2em] uppercase">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center
                         text-text-muted/50 hover:text-text-primary hover:bg-bg-hover
                         transition-all duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* Output Directory */}
          <div className="mb-8">
            <label className="block font-display text-[10px] text-text-muted tracking-[0.15em] uppercase mb-2.5">
              Output Directory
            </label>
            <input
              type="text"
              value={settings.outputDir}
              onChange={(e) =>
                onSettingsChange({ ...settings, outputDir: e.target.value })
              }
              className="w-full bg-bg-elevated/80 text-text-primary border border-text-muted/10 rounded-md
                         px-3 py-2.5 text-xs font-display
                         focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20
                         placeholder:text-text-muted/30
                         transition-all duration-200"
              placeholder="~/Downloads/SimurghForge/"
            />
          </div>

          {/* Max File Size */}
          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-2.5">
              <label className="font-display text-[10px] text-text-muted tracking-[0.15em] uppercase">
                Max File Size
              </label>
              <span className="font-display text-[11px] text-accent tabular-nums">
                {Math.round(settings.maxFileSize / (1024 * 1024))} MB
              </span>
            </div>
            <input
              type="range"
              min={10 * 1024 * 1024}
              max={2000 * 1024 * 1024}
              step={10 * 1024 * 1024}
              value={settings.maxFileSize}
              onChange={(e) =>
                onSettingsChange({ ...settings, maxFileSize: Number(e.target.value) })
              }
            />
          </div>

          {/* Concurrency */}
          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-2.5">
              <label className="font-display text-[10px] text-text-muted tracking-[0.15em] uppercase">
                Concurrency
              </label>
              <span className="font-display text-[11px] text-accent tabular-nums">
                {settings.maxConcurrency} threads
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={settings.maxConcurrency}
              onChange={(e) =>
                onSettingsChange({ ...settings, maxConcurrency: Number(e.target.value) })
              }
            />
          </div>

          {/* About section */}
          <div className="forge-separator mb-6" />
          <div className="text-center">
            <p className="font-display text-[10px] text-text-muted/30 tracking-wider">
              SIMURGH FORGE v0.1.0
            </p>
            <p className="text-[9px] text-text-muted/20 mt-1 font-body">
              Built by Raouf Abedini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
