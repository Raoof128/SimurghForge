export type ConversionStatus = "queued" | "converting" | "done" | "error";

export type QualityPreset = "low" | "medium" | "high" | "lossless";

export interface ImageOptions {
  quality: number; // 1-100
  maxWidth?: number; // max pixel width
  maxHeight?: number; // max pixel height
  dpi?: number; // 72, 150, 300, 600
  stripMetadata: boolean;
}

export interface VideoOptions {
  resolution?: string; // "720p", "1080p", "1440p", "4k", "original"
  bitrate?: number; // kbps
  codec?: string; // "h264", "h265", "vp9"
  fps?: number; // 24, 30, 60, "original"
}

export interface AudioOptions {
  sampleRate?: number; // 44100, 48000, 96000
  bitrate?: number; // kbps
  channels?: number; // 1 = mono, 2 = stereo
}

export interface PdfOptions {
  compression: string; // "none", "low", "medium", "high"
  imageDpi?: number;
}

export interface DataOptions {
  delimiter?: string; // ",", "\t", "|"
  prettyPrint: boolean;
  encoding?: string; // "utf-8", "latin-1"
}

export interface ConversionOptions {
  preset: QualityPreset;
  image?: ImageOptions;
  video?: VideoOptions;
  audio?: AudioOptions;
  pdf?: PdfOptions;
  data?: DataOptions;
}

export const DEFAULT_OPTIONS: ConversionOptions = {
  preset: "high",
  image: { quality: 95, stripMetadata: false },
  video: { resolution: "original", codec: "h264" },
  audio: { sampleRate: 48000, bitrate: 320, channels: 2 },
  pdf: { compression: "low" },
  data: { prettyPrint: true, delimiter: ",", encoding: "utf-8" },
};

export const PRESETS: Record<QualityPreset, Partial<ConversionOptions>> = {
  low: {
    image: { quality: 60, maxWidth: 1024, maxHeight: 1024, stripMetadata: true },
    video: { resolution: "720p", bitrate: 1000, codec: "h264" },
    audio: { bitrate: 128, channels: 2 },
    pdf: { compression: "high", imageDpi: 72 },
  },
  medium: {
    image: { quality: 80, maxWidth: 2048, maxHeight: 2048, stripMetadata: false },
    video: { resolution: "1080p", bitrate: 5000, codec: "h264" },
    audio: { bitrate: 192, channels: 2 },
    pdf: { compression: "medium", imageDpi: 150 },
  },
  high: {
    image: { quality: 95, stripMetadata: false },
    video: { resolution: "original", bitrate: 15000, codec: "h264" },
    audio: { bitrate: 320, channels: 2 },
    pdf: { compression: "low", imageDpi: 300 },
  },
  lossless: {
    image: { quality: 100, stripMetadata: false },
    video: { resolution: "original", codec: "h264" },
    audio: { bitrate: 1411, channels: 2 },
    pdf: { compression: "none", imageDpi: 600 },
  },
};

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  inputFormat: string;
  outputFormat: string;
  status: ConversionStatus;
  percent: number;
  errorMsg?: string;
  outputPath?: string;
  options: ConversionOptions;
}

export interface ProgressEvent {
  id: string;
  status: ConversionStatus;
  percent: number;
  errorMsg?: string;
  outputPath?: string;
}

export interface BatchCompleteEvent {
  totalFiles: number;
  succeeded: number;
  failed: number;
  outputDir: string;
  zipPath?: string;
}

export interface ConvertBatchPayload {
  files: {
    id: string;
    inputPath: string;
    outputFormat: string;
    options: ConversionOptions;
  }[];
  outputDir: string;
  maxConcurrency: number;
}

export interface AppSettings {
  outputDir: string;
  maxFileSize: number;
  maxConcurrency: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  outputDir: "",
  maxFileSize: 500 * 1024 * 1024,
  maxConcurrency: 4,
};

export interface SkippedNotification {
  count: number;
  message: string;
}
