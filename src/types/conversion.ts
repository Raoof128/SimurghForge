export type ConversionStatus = "queued" | "converting" | "done" | "error";

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
