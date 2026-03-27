export const FORMAT_MAP: Record<string, string[]> = {
  // Documents — LibreOffice Headless
  docx: ["pdf", "txt", "html", "odt", "rtf", "md"],
  pdf:  ["docx", "txt", "html"],
  odt:  ["pdf", "docx", "txt", "html"],
  rtf:  ["pdf", "docx", "txt", "html"],

  // Markup — Pandoc
  md:   ["docx", "pdf", "html", "txt"],
  html: ["pdf", "docx", "md", "txt"],
  txt:  ["pdf", "docx", "md", "html"],

  // Images — ImageMagick
  png:  ["jpg", "webp", "avif", "tiff", "bmp", "svg"],
  jpg:  ["png", "webp", "avif", "tiff", "bmp"],
  jpeg: ["png", "webp", "avif", "tiff", "bmp"],
  heic: ["jpg", "png", "webp"],
  svg:  ["png", "jpg", "webp", "pdf"],
  webp: ["png", "jpg", "tiff", "bmp"],
  tiff: ["png", "jpg", "webp"],
  bmp:  ["png", "jpg", "webp"],

  // Audio/Video — FFmpeg
  mp4:  ["mp3", "wav", "webm", "mov", "gif", "avi"],
  mov:  ["mp4", "mp3", "gif", "webm"],
  webm: ["mp4", "mp3", "gif"],
  avi:  ["mp4", "mp3", "webm"],
  mp3:  ["wav", "flac", "ogg", "aac", "m4a"],
  wav:  ["mp3", "flac", "ogg", "aac"],
  flac: ["mp3", "wav", "ogg", "aac"],
  ogg:  ["mp3", "wav", "flac"],
  aac:  ["mp3", "wav", "flac"],
  m4a:  ["mp3", "wav", "flac", "ogg"],

  // Data — Pandas
  csv:     ["json", "xlsx", "parquet", "tsv"],
  xlsx:    ["csv", "json", "parquet", "tsv"],
  json:    ["csv", "xlsx", "tsv"],
  parquet: ["csv", "json", "xlsx", "tsv"],
  tsv:     ["csv", "json", "xlsx", "parquet"],
};

export function getOutputFormats(filename: string): string[] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FORMAT_MAP[ext] ?? [];
}

export function getInputExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}
