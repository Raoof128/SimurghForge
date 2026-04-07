import type { ConversionStatus } from "../types/conversion";

// -------------------------------------------------------------------------- //
// ENGLISH UI STRINGS (default locale) //
// -------------------------------------------------------------------------- //

export const strings = {
  appSubtitle: "Universal File Converter",
  appTitle: "Simurgh Forge",

  browse: "Browse",
  browseFiles: "Browse Files",

  completionFailedInline: "{count} failed",
  completionForgedPlural: "{count} files forged",
  completionForgedSingular: "1 file forged",
  completionOpenFolder: "Open Folder",

  dropHint: "Images, documents, audio, video, data",
  dropMoreCollapsed: "Drop more files here",
  dropReleaseAdd: "Release to add more",
  dropReleaseForge: "Release to forge",
  dropTitle: "Drop files here to begin",

  fileCardAriaGroup: "File: {name}, Status: {status}",
  fileCardComplete: "Complete",
  fileCardForging: "FORGING",
  fileCardOpen: "Open",
  fileCardRemove: "Remove",
  fileCardRetry: "RETRY",
  fileCardQualitySettings: "Quality settings",

  fileSizeB: "{n} B",
  fileSizeKb: "{n} KB",
  fileSizeMb: "{n} MB",

  conversionFailedDefault: "Conversion failed",

  formatOutputFormats: "Output formats",
  formatOutputFormatLabel: "Output format: {format}",

  notificationSkippedPlural: "{count} files skipped (unsupported format)",
  notificationSkippedSingular: "1 file skipped (unsupported format)",

  progressConversion: "Conversion progress: {percent}%",

  queueClear: "Clear",
  queueDone: "{count} done",
  queueFailed: "{count} failed",
  queueForgeAll: "Forge All",
  queueForging: "Forging...",
  queueHeading: "Queue",
  queueNewBatch: "New Batch",

  settingsAboutAuthor: "Built by Raouf Abedini",
  settingsAboutVersion: "SIMURGH FORGE v{version}",
  settingsAriaLabel: "Settings",
  settingsClose: "Close settings panel",
  settingsConcurrency: "Concurrency",
  settingsConcurrencyThreads: "{count} threads",
  settingsMaxFileSize: "Max File Size",
  settingsMaxFileSizeReadout: "{n} MB",
  settingsOutputDir: "Output Directory",
  settingsOutputDirBrowse: "Browse for output folder",
  settingsOutputDirPlaceholder: "~/Downloads/SimurghForge/",
  settingsTitle: "Settings",

  dialogSelectFilesTitle: "Select files to convert",
  dialogOutputFolderTitle: "Choose output directory",

  qualityAdvanced: "Advanced",
  qualityLabel: "Quality",
  qualityPresetHigh: "High",
  qualityPresetLow: "Low",
  qualityPresetMax: "Max",
  qualityPresetMed: "Med",
  qualitySimple: "Simple",

  qcBitrate: "Bitrate",
  qcChannels: "Channels",
  qcCodec: "Codec",
  qcCompression: "Compression",
  qcDelimiter: "Delimiter",
  qcDpi: "DPI",
  qcEncoding: "Encoding",
  qcFps: "FPS",
  qcImageDpi: "Image DPI",
  qcMaxWidth: "Max Width",
  qcPrettyPrint: "Pretty Print",
  qcResolution: "Resolution",
  qcSampleRate: "Sample Rate",
  qcSample44100: "44.1 kHz",
  qcSample48000: "48 kHz",
  qcSample96000: "96 kHz",
  qcStripMetadata: "Strip Metadata",

  qcValueAuto: "Auto",
  qcValueOriginal: "Original",
  qcValueMono: "Mono",
  qcValueStereo: "Stereo",
  qcDelimiterComma: "Comma",
  qcDelimiterTab: "Tab",
  qcDelimiterPipe: "Pipe",

  qcVideoCodecH264: "H.264",
  qcVideoCodecH265: "H.265",
  qcVideoCodecVp9: "VP9",

  qcPdfCompressionNone: "None",
  qcPdfCompressionLow: "Low",
  qcPdfCompressionMedium: "Medium",
  qcPdfCompressionHigh: "High",

  qcEncodingUtf8: "UTF-8",
  qcEncodingLatin1: "Latin-1",

  qcRes720p: "720p",
  qcRes1080p: "1080p",
  qcRes1440p: "1440p",
  qcRes4k: "4K",

  formatMore: "+ {count} more",

  statusQueued: "Queued",
  statusConverting: "Converting",
  statusDone: "Done",
  statusError: "Failed",

  ariaClearQueue: "Clear queue",
  ariaConvertAll: "Convert all queued files",
  ariaNewBatch: "Reset queue for new files",
  ariaSettingsButton: "Settings",
  ariaOpenConvertedFile: "Open converted file {name}",
  ariaToastNotification: "Notification",

  metaAppDescription:
    "Simurgh Forge — universal file converter desktop app with batch conversion and quality controls.",
} as const;

export type StringKey = keyof typeof strings;

/** Replace `{name}`-style placeholders in a string template. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function t(key: StringKey): string {
  return strings[key];
}

export function tNotificationSkipped(count: number): string {
  return count === 1
    ? strings.notificationSkippedSingular
    : interpolate(strings.notificationSkippedPlural, { count });
}

export function tCompletionForged(succeeded: number): string {
  return succeeded === 1
    ? strings.completionForgedSingular
    : interpolate(strings.completionForgedPlural, { count: succeeded });
}

export function tFileStatus(status: ConversionStatus): string {
  switch (status) {
    case "converting":
      return strings.statusConverting;
    case "done":
      return strings.statusDone;
    case "error":
      return strings.statusError;
    case "queued":
      return strings.statusQueued;
  }
}
