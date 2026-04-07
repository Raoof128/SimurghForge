import type { ReactNode } from "react";
import { useState } from "react";
import type { ConversionOptions, QualityPreset } from "../types/conversion";
import { PRESETS, DEFAULT_OPTIONS } from "../types/conversion";
import type { StringKey } from "../i18n/strings";
import { t } from "../i18n/strings";

interface QualityControlsProps {
  options: ConversionOptions;
  outputFormat: string;
  onChange: (options: ConversionOptions) => void;
  disabled?: boolean;
}

const IMAGE_FORMATS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "avif",
  "tiff",
  "bmp",
  "ico",
  "heic",
  "cr2",
  "nef",
];
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

const PRESET_ENTRIES: { key: QualityPreset; labelKey: StringKey }[] = [
  { key: "low", labelKey: "qualityPresetLow" },
  { key: "medium", labelKey: "qualityPresetMed" },
  { key: "high", labelKey: "qualityPresetHigh" },
  { key: "lossless", labelKey: "qualityPresetMax" },
];

function videoResolutionLabel(value: string): string {
  switch (value) {
    case "720p":
      return t("qcRes720p");
    case "1080p":
      return t("qcRes1080p");
    case "1440p":
      return t("qcRes1440p");
    case "4k":
      return t("qcRes4k");
    case "original":
      return t("qcValueOriginal");
    default:
      return value;
  }
}

export function QualityControls({
  options,
  outputFormat,
  onChange,
  disabled,
}: QualityControlsProps) {
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
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-display text-text-muted/50 tracking-wider uppercase mr-1.5">
          {t("qualityLabel")}
        </span>
        {PRESET_ENTRIES.map(({ key, labelKey }) => (
          <button
            type="button"
            key={key}
            onClick={() => handlePreset(key)}
            disabled={disabled}
            className={`text-[10px] font-display tracking-wider uppercase px-2 py-0.5 rounded
                       transition-all duration-150 disabled:opacity-30
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                       ${
                         options.preset === key
                           ? "bg-accent/15 text-accent border border-accent/30"
                           : "text-text-muted/60 hover:text-text-primary hover:bg-bg-hover border border-transparent"
                       }`}
          >
            {t(labelKey)}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={disabled}
          className={`ml-auto text-[10px] font-display tracking-wider uppercase px-1.5 py-0.5
                     transition-all duration-150 disabled:opacity-30
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                     ${showAdvanced ? "text-accent" : "text-text-muted/40 hover:text-text-muted"}`}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? t("qualitySimple") : t("qualityAdvanced")}
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-2.5 space-y-2.5 animate-fade-in">
          {category === "image" && options.image && (
            <>
              <ControlRow label={t("qualityLabel")} value={`${options.image.quality}%`}>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={options.image.quality}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      image: { ...options.image!, quality: Number(e.target.value) },
                    })
                  }
                  aria-label={t("qualityLabel")}
                />
              </ControlRow>
              <ControlRow
                label={t("qcMaxWidth")}
                value={
                  options.image.maxWidth
                    ? `${options.image.maxWidth}px`
                    : t("qcValueOriginal")
                }
              >
                <input
                  type="range"
                  min={0}
                  max={4096}
                  step={128}
                  value={options.image.maxWidth ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({
                      ...options,
                      image: { ...options.image!, maxWidth: v > 0 ? v : undefined },
                    });
                  }}
                  aria-label={t("qcMaxWidth")}
                />
              </ControlRow>
              <ControlRow label={t("qcDpi")} value={options.image.dpi ?? t("qcValueAuto")}>
                <select
                  value={options.image.dpi ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      image: {
                        ...options.image!,
                        dpi: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcDpi")}
                >
                  <option value="">{t("qcValueAuto")}</option>
                  <option value="72">72</option>
                  <option value="150">150</option>
                  <option value="300">300</option>
                  <option value="600">600</option>
                </select>
              </ControlRow>
              <ControlToggle
                label={t("qcStripMetadata")}
                checked={options.image.stripMetadata}
                onChange={(v) =>
                  onChange({ ...options, image: { ...options.image!, stripMetadata: v } })
                }
              />
            </>
          )}

          {category === "video" && options.video && (
            <>
              <ControlRow
                label={t("qcResolution")}
                value={videoResolutionLabel(options.video.resolution ?? "original")}
              >
                <select
                  value={options.video.resolution ?? "original"}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      video: { ...options.video!, resolution: e.target.value },
                    })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcResolution")}
                >
                  <option value="original">{t("qcValueOriginal")}</option>
                  <option value="720p">{t("qcRes720p")}</option>
                  <option value="1080p">{t("qcRes1080p")}</option>
                  <option value="1440p">{t("qcRes1440p")}</option>
                  <option value="4k">{t("qcRes4k")}</option>
                </select>
              </ControlRow>
              <ControlRow
                label={t("qcBitrate")}
                value={
                  options.video.bitrate ? `${options.video.bitrate} kbps` : t("qcValueAuto")
                }
              >
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={options.video.bitrate ?? 5000}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      video: { ...options.video!, bitrate: Number(e.target.value) },
                    })
                  }
                  aria-label={t("qcBitrate")}
                />
              </ControlRow>
              <ControlRow label={t("qcCodec")} value={(options.video.codec ?? "h264").toUpperCase()}>
                <select
                  value={options.video.codec ?? "h264"}
                  onChange={(e) =>
                    onChange({ ...options, video: { ...options.video!, codec: e.target.value } })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcCodec")}
                >
                  <option value="h264">{t("qcVideoCodecH264")}</option>
                  <option value="h265">{t("qcVideoCodecH265")}</option>
                  <option value="vp9">{t("qcVideoCodecVp9")}</option>
                </select>
              </ControlRow>
              <ControlRow
                label={t("qcFps")}
                value={
                  options.video.fps != null ? String(options.video.fps) : t("qcValueOriginal")
                }
              >
                <select
                  value={options.video.fps ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      video: {
                        ...options.video!,
                        fps: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcFps")}
                >
                  <option value="">{t("qcValueOriginal")}</option>
                  <option value="24">24</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </select>
              </ControlRow>
            </>
          )}

          {category === "audio" && options.audio && (
            <>
              <ControlRow label={t("qcBitrate")} value={`${options.audio.bitrate ?? 320} kbps`}>
                <input
                  type="range"
                  min={64}
                  max={1411}
                  step={32}
                  value={options.audio.bitrate ?? 320}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      audio: { ...options.audio!, bitrate: Number(e.target.value) },
                    })
                  }
                  aria-label={t("qcBitrate")}
                />
              </ControlRow>
              <ControlRow
                label={t("qcSampleRate")}
                value={`${(options.audio.sampleRate ?? 48000) / 1000} kHz`}
              >
                <select
                  value={options.audio.sampleRate ?? 48000}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      audio: { ...options.audio!, sampleRate: Number(e.target.value) },
                    })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcSampleRate")}
                >
                  <option value="44100">{t("qcSample44100")}</option>
                  <option value="48000">{t("qcSample48000")}</option>
                  <option value="96000">{t("qcSample96000")}</option>
                </select>
              </ControlRow>
              <ControlRow
                label={t("qcChannels")}
                value={options.audio.channels === 1 ? t("qcValueMono") : t("qcValueStereo")}
              >
                <select
                  value={options.audio.channels ?? 2}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      audio: { ...options.audio!, channels: Number(e.target.value) },
                    })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcChannels")}
                >
                  <option value="2">{t("qcValueStereo")}</option>
                  <option value="1">{t("qcValueMono")}</option>
                </select>
              </ControlRow>
            </>
          )}

          {category === "pdf" && options.pdf && (
            <>
              <ControlRow label={t("qcCompression")} value={options.pdf.compression}>
                <select
                  value={options.pdf.compression}
                  onChange={(e) =>
                    onChange({ ...options, pdf: { ...options.pdf!, compression: e.target.value } })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcCompression")}
                >
                  <option value="none">{t("qcPdfCompressionNone")}</option>
                  <option value="low">{t("qcPdfCompressionLow")}</option>
                  <option value="medium">{t("qcPdfCompressionMedium")}</option>
                  <option value="high">{t("qcPdfCompressionHigh")}</option>
                </select>
              </ControlRow>
              <ControlRow label={t("qcImageDpi")} value={options.pdf.imageDpi ?? t("qcValueAuto")}>
                <select
                  value={options.pdf.imageDpi ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      pdf: {
                        ...options.pdf!,
                        imageDpi: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcImageDpi")}
                >
                  <option value="">{t("qcValueAuto")}</option>
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
                <ControlRow
                  label={t("qcDelimiter")}
                  value={
                    options.data.delimiter === "\t" ? t("qcDelimiterTab") : options.data.delimiter === "|"
                      ? t("qcDelimiterPipe")
                      : t("qcDelimiterComma")
                  }
                >
                  <select
                    value={options.data.delimiter ?? ","}
                    onChange={(e) =>
                      onChange({
                        ...options,
                        data: { ...options.data!, delimiter: e.target.value },
                      })
                    }
                    className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                    aria-label={t("qcDelimiter")}
                  >
                    <option value=",">{t("qcDelimiterComma")}</option>
                    <option value={"\t"}>{t("qcDelimiterTab")}</option>
                    <option value="|">{t("qcDelimiterPipe")}</option>
                  </select>
                </ControlRow>
              )}
              {(outputFormat === "json" ||
                outputFormat === "xml" ||
                outputFormat === "yaml" ||
                outputFormat === "toml") && (
                <ControlToggle
                  label={t("qcPrettyPrint")}
                  checked={options.data.prettyPrint}
                  onChange={(v) =>
                    onChange({ ...options, data: { ...options.data!, prettyPrint: v } })
                  }
                />
              )}
              <ControlRow label={t("qcEncoding")} value={options.data.encoding ?? "UTF-8"}>
                <select
                  value={options.data.encoding ?? "utf-8"}
                  onChange={(e) =>
                    onChange({ ...options, data: { ...options.data!, encoding: e.target.value } })
                  }
                  className="bg-bg-elevated text-text-primary border border-text-muted/10 rounded px-2 py-0.5 text-[11px] font-display"
                  aria-label={t("qcEncoding")}
                >
                  <option value="utf-8">{t("qcEncodingUtf8")}</option>
                  <option value="latin-1">{t("qcEncodingLatin1")}</option>
                </select>
              </ControlRow>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ControlRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string | number;
  children: ReactNode;
}) {
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

function ControlToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-display text-text-muted/50 tracking-wider uppercase w-20 flex-shrink-0">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          checked ? "bg-accent/30" : "bg-bg-elevated"
        }`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${
            checked ? "left-4 bg-accent" : "left-0.5 bg-text-muted/40"
          }`}
        />
      </button>
    </div>
  );
}
