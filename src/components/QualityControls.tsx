import { useState } from "react";
import type { ConversionOptions, QualityPreset } from "../types/conversion";
import { PRESETS, DEFAULT_OPTIONS } from "../types/conversion";

interface QualityControlsProps {
  options: ConversionOptions;
  outputFormat: string;
  onChange: (options: ConversionOptions) => void;
  disabled?: boolean;
}

const IMAGE_FORMATS = ["png", "jpg", "jpeg", "webp", "avif", "tiff", "bmp", "ico", "heic", "cr2", "nef"];
const VIDEO_FORMATS = ["mp4", "mov", "webm", "mkv", "avi", "gif"];
const AUDIO_FORMATS = ["mp3", "wav", "flac", "ogg", "aac", "opus", "m4a"];
const DATA_FORMATS = ["csv", "json", "xlsx", "yaml", "toml", "xml", "tsv", "parquet", "sqlite"];

function getFormatCategory(fmt: string): string {
  if (IMAGE_FORMATS.includes(fmt)) return "image";
  if (VIDEO_FORMATS.includes(fmt)) return "video";
  if (AUDIO_FORMATS.includes(fmt)) return "audio";
  if (fmt === "pdf") return "pdf";
  if (DATA_FORMATS.includes(fmt)) return "data";
  return "other";
}

const PRESET_LABELS: { key: QualityPreset; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Med" },
  { key: "high", label: "High" },
  { key: "lossless", label: "Max" },
];

export function QualityControls({ options, outputFormat, onChange, disabled }: QualityControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const category = getFormatCategory(outputFormat);

  const handlePreset = (preset: QualityPreset) => {
    const presetValues = PRESETS[preset];
    onChange({
      ...DEFAULT_OPTIONS,
      ...presetValues,
      preset,
    });
  };

  if (category === "other") return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-text-muted/8">
      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-display text-text-muted/50 tracking-wider uppercase mr-1.5">
          Quality
        </span>
        {PRESET_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            disabled={disabled}
            className={`text-[10px] font-display tracking-wider uppercase px-2 py-0.5 rounded
                       transition-all duration-150 disabled:opacity-30
                       ${options.preset === key
                         ? "bg-accent/15 text-accent border border-accent/30"
                         : "text-text-muted/60 hover:text-text-primary hover:bg-bg-hover border border-transparent"
                       }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={disabled}
          className={`ml-auto text-[10px] font-display tracking-wider uppercase px-1.5 py-0.5
                     transition-all duration-150 disabled:opacity-30
                     ${showAdvanced ? "text-accent" : "text-text-muted/40 hover:text-text-muted"}`}
        >
          {showAdvanced ? "Simple" : "Advanced"}
        </button>
      </div>

      {/* Advanced controls */}
      {showAdvanced && (
        <div className="mt-2.5 space-y-2.5 animate-fade-in">
          {category === "image" && options.image && (
            <>
              <ControlRow label="Quality" value={`${options.image.quality}%`}>
                <input type="range" min={1} max={100} value={options.image.quality}
                  onChange={(e) => onChange({ ...options, image: { ...options.image!, quality: Number(e.target.value) } })} />
              </ControlRow>
              <ControlRow label="Max Width" value={options.image.maxWidth ? `${options.image.maxWidth}px` : "Original"}>
                <input type="range" min={0} max={4096} step={128} value={options.image.maxWidth ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({ ...options, image: { ...options.image!, maxWidth: v > 0 ? v : undefined } });
                  }} />
              </ControlRow>
              <ControlRow label="DPI" value={options.image.dpi ?? "Auto"}>
                <select value={options.image.dpi ?? ""} onChange={(e) => onChange({ ...options, image: { ...options.image!, dpi: e.target.value ? Number(e.target.value) : undefined } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="">Auto</option>
                  <option value="72">72</option>
                  <option value="150">150</option>
                  <option value="300">300</option>
                  <option value="600">600</option>
                </select>
              </ControlRow>
              <ControlToggle label="Strip Metadata" checked={options.image.stripMetadata}
                onChange={(v) => onChange({ ...options, image: { ...options.image!, stripMetadata: v } })} />
            </>
          )}

          {category === "video" && options.video && (
            <>
              <ControlRow label="Resolution" value={options.video.resolution ?? "Original"}>
                <select value={options.video.resolution ?? "original"} onChange={(e) => onChange({ ...options, video: { ...options.video!, resolution: e.target.value } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="original">Original</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="1440p">1440p</option>
                  <option value="4k">4K</option>
                </select>
              </ControlRow>
              <ControlRow label="Bitrate" value={options.video.bitrate ? `${options.video.bitrate} kbps` : "Auto"}>
                <input type="range" min={500} max={50000} step={500} value={options.video.bitrate ?? 5000}
                  onChange={(e) => onChange({ ...options, video: { ...options.video!, bitrate: Number(e.target.value) } })} />
              </ControlRow>
              <ControlRow label="Codec" value={(options.video.codec ?? "h264").toUpperCase()}>
                <select value={options.video.codec ?? "h264"} onChange={(e) => onChange({ ...options, video: { ...options.video!, codec: e.target.value } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="h264">H.264</option>
                  <option value="h265">H.265</option>
                  <option value="vp9">VP9</option>
                </select>
              </ControlRow>
              <ControlRow label="FPS" value={options.video.fps ?? "Original"}>
                <select value={options.video.fps ?? ""} onChange={(e) => onChange({ ...options, video: { ...options.video!, fps: e.target.value ? Number(e.target.value) : undefined } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="">Original</option>
                  <option value="24">24</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </select>
              </ControlRow>
            </>
          )}

          {category === "audio" && options.audio && (
            <>
              <ControlRow label="Bitrate" value={`${options.audio.bitrate ?? 320} kbps`}>
                <input type="range" min={64} max={1411} step={32} value={options.audio.bitrate ?? 320}
                  onChange={(e) => onChange({ ...options, audio: { ...options.audio!, bitrate: Number(e.target.value) } })} />
              </ControlRow>
              <ControlRow label="Sample Rate" value={`${(options.audio.sampleRate ?? 48000) / 1000} kHz`}>
                <select value={options.audio.sampleRate ?? 48000} onChange={(e) => onChange({ ...options, audio: { ...options.audio!, sampleRate: Number(e.target.value) } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="44100">44.1 kHz</option>
                  <option value="48000">48 kHz</option>
                  <option value="96000">96 kHz</option>
                </select>
              </ControlRow>
              <ControlRow label="Channels" value={options.audio.channels === 1 ? "Mono" : "Stereo"}>
                <select value={options.audio.channels ?? 2} onChange={(e) => onChange({ ...options, audio: { ...options.audio!, channels: Number(e.target.value) } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="2">Stereo</option>
                  <option value="1">Mono</option>
                </select>
              </ControlRow>
            </>
          )}

          {category === "pdf" && options.pdf && (
            <>
              <ControlRow label="Compression" value={options.pdf.compression}>
                <select value={options.pdf.compression} onChange={(e) => onChange({ ...options, pdf: { ...options.pdf!, compression: e.target.value } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </ControlRow>
              <ControlRow label="Image DPI" value={options.pdf.imageDpi ?? "Auto"}>
                <select value={options.pdf.imageDpi ?? ""} onChange={(e) => onChange({ ...options, pdf: { ...options.pdf!, imageDpi: e.target.value ? Number(e.target.value) : undefined } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="">Auto</option>
                  <option value="72">72</option>
                  <option value="150">150</option>
                  <option value="300">300</option>
                  <option value="600">600</option>
                </select>
              </ControlRow>
            </>
          )}

          {category === "data" && options.data && (
            <>
              {(outputFormat === "csv" || outputFormat === "tsv") && (
                <ControlRow label="Delimiter" value={options.data.delimiter === "\t" ? "Tab" : options.data.delimiter ?? ","}>
                  <select value={options.data.delimiter ?? ","} onChange={(e) => onChange({ ...options, data: { ...options.data!, delimiter: e.target.value } })}
                    className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                    <option value=",">Comma</option>
                    <option value="&#9;">Tab</option>
                    <option value="|">Pipe</option>
                  </select>
                </ControlRow>
              )}
              {(outputFormat === "json" || outputFormat === "xml" || outputFormat === "yaml" || outputFormat === "toml") && (
                <ControlToggle label="Pretty Print" checked={options.data.prettyPrint}
                  onChange={(v) => onChange({ ...options, data: { ...options.data!, prettyPrint: v } })} />
              )}
              <ControlRow label="Encoding" value={options.data.encoding ?? "UTF-8"}>
                <select value={options.data.encoding ?? "utf-8"} onChange={(e) => onChange({ ...options, data: { ...options.data!, encoding: e.target.value } })}
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display">
                  <option value="utf-8">UTF-8</option>
                  <option value="latin-1">Latin-1</option>
                </select>
              </ControlRow>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Helper components

function ControlRow({ label, value, children }: { label: string; value: string | number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-display text-text-muted/50 tracking-wider uppercase w-20 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1">{children}</div>
      <span className="text-[10px] font-display text-accent tabular-nums w-16 text-right flex-shrink-0">
        {value}
      </span>
    </div>
  );
}

function ControlToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-display text-text-muted/50 tracking-wider uppercase w-20 flex-shrink-0">
        {label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-all duration-200 relative ${checked ? "bg-accent/30" : "bg-bg-elevated"}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${checked ? "left-4 bg-accent" : "left-0.5 bg-text-muted/40"}`} />
      </button>
    </div>
  );
}
