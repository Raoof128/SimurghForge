import { open } from "@tauri-apps/plugin-dialog";
import packageJson from "../../package.json";
import type { AppSettings } from "../types/conversion";
import { interpolate, t } from "../i18n/strings";

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ settings, onSettingsChange, isOpen, onClose }: SettingsProps) {
  if (!isOpen) return null;

  const handleBrowseOutputDir = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t("dialogOutputFolderTitle"),
    });
    if (selected && typeof selected === "string") {
      onSettingsChange({ ...settings, outputDir: selected });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end animate-fade-in"
      role="dialog"
      aria-label={t("settingsAriaLabel")}
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-default border-0 p-0"
        onClick={onClose}
        aria-label={t("settingsClose")}
      />

      <div className="animate-slide-in-right relative w-80 bg-bg-surface/95 backdrop-blur-xl border-l border-accent-dim/20 h-full overflow-y-auto">
        <div className="sticky top-0 bg-bg-surface/95 backdrop-blur-xl z-10">
          <div
            className="h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent"
            aria-hidden
          />
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="font-display text-[13px] text-accent tracking-[0.2em] uppercase">
              {t("settingsTitle")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center
                         text-text-muted/50 hover:text-text-primary hover:bg-bg-hover
                         transition-all duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label={t("settingsClose")}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path
                  d="M4 4l6 6M10 4l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="mb-8">
            <label
              htmlFor="settings-output-dir"
              className="block font-display text-[10px] text-text-muted tracking-[0.15em] uppercase mb-2.5"
            >
              {t("settingsOutputDir")}
            </label>
            <div className="flex gap-2">
              <input
                id="settings-output-dir"
                type="text"
                value={settings.outputDir}
                onChange={(e) => onSettingsChange({ ...settings, outputDir: e.target.value })}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-bg-elevated/80 text-text-primary border border-text-muted/10 rounded-md
                           px-3 py-2.5 text-xs font-display
                           focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                           placeholder:text-text-muted/30
                           transition-all duration-200"
                placeholder={t("settingsOutputDirPlaceholder")}
              />
              <button
                type="button"
                onClick={handleBrowseOutputDir}
                className="flex-shrink-0 w-10 h-10 rounded-md bg-bg-elevated/80 border border-text-muted/10
                           flex items-center justify-center
                           text-text-muted hover:text-accent hover:border-accent/40
                           transition-all duration-200
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                title={t("settingsOutputDirBrowse")}
                aria-label={t("settingsOutputDirBrowse")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <path
                    d="M2 4h4l2 2h6v7H2V4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-2.5">
              <label
                htmlFor="settings-max-file-size"
                className="font-display text-[10px] text-text-muted tracking-[0.15em] uppercase"
              >
                {t("settingsMaxFileSize")}
              </label>
              <span
                className="font-display text-[11px] text-accent tabular-nums"
                id="settings-max-file-size-readout"
              >
                {interpolate(t("settingsMaxFileSizeReadout"), {
                  n: Math.round(settings.maxFileSize / (1024 * 1024)),
                })}
              </span>
            </div>
            <input
              id="settings-max-file-size"
              type="range"
              min={10 * 1024 * 1024}
              max={2000 * 1024 * 1024}
              step={10 * 1024 * 1024}
              value={settings.maxFileSize}
              onChange={(e) =>
                onSettingsChange({ ...settings, maxFileSize: Number(e.target.value) })
              }
              aria-valuetext={interpolate(t("settingsMaxFileSizeReadout"), {
                n: Math.round(settings.maxFileSize / (1024 * 1024)),
              })}
            />
          </div>

          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-2.5">
              <label
                htmlFor="settings-concurrency"
                className="font-display text-[10px] text-text-muted tracking-[0.15em] uppercase"
              >
                {t("settingsConcurrency")}
              </label>
              <span
                className="font-display text-[11px] text-accent tabular-nums"
                id="settings-concurrency-readout"
              >
                {interpolate(t("settingsConcurrencyThreads"), { count: settings.maxConcurrency })}
              </span>
            </div>
            <input
              id="settings-concurrency"
              type="range"
              min={1}
              max={8}
              step={1}
              value={settings.maxConcurrency}
              onChange={(e) =>
                onSettingsChange({ ...settings, maxConcurrency: Number(e.target.value) })
              }
              aria-valuemin={1}
              aria-valuemax={8}
              aria-valuetext={interpolate(t("settingsConcurrencyThreads"), {
                count: settings.maxConcurrency,
              })}
            />
          </div>

          <div className="forge-separator mb-6" />
          <div className="text-center">
            <p className="font-display text-[10px] text-text-muted/30 tracking-wider">
              {interpolate(t("settingsAboutVersion"), { version: packageJson.version })}
            </p>
            <p className="text-[9px] text-text-muted/20 mt-1 font-body">
              {t("settingsAboutAuthor")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
