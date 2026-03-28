// Each input format maps to common (shown first) and more (collapsed) output options.
// Common = what 90% of users want. More = niche but supported.

interface FormatOptions {
  common: string[];
  more: string[];
}

const FORMAT_MAP_DETAILED: Record<string, FormatOptions> = {
  // Documents
  docx: { common: ["pdf"],            more: ["txt", "html"] },
  pdf:  { common: ["docx"],           more: ["txt", "html"] },
  odt:  { common: ["pdf", "docx"],    more: ["txt"] },
  rtf:  { common: ["pdf", "docx"],    more: ["txt"] },
  pptx: { common: ["pdf"],            more: [] },

  // Markup
  md:   { common: ["pdf", "html"],    more: ["docx", "txt", "epub"] },
  html: { common: ["pdf"],            more: ["docx", "md", "txt"] },
  txt:  { common: ["pdf"],            more: ["docx", "md", "html"] },
  tex:  { common: ["pdf"],            more: ["html", "docx", "epub"] },
  epub: { common: ["pdf", "html"],    more: ["docx", "txt"] },

  // Images
  png:  { common: ["jpg", "webp"],    more: ["avif", "tiff", "bmp", "ico"] },
  jpg:  { common: ["png", "webp"],    more: ["avif", "tiff", "bmp"] },
  jpeg: { common: ["png", "webp"],    more: ["avif", "tiff", "bmp"] },
  heic: { common: ["jpg", "png"],     more: ["webp"] },
  svg:  { common: ["png"],            more: ["jpg", "webp", "pdf"] },
  webp: { common: ["png", "jpg"],     more: ["avif", "tiff", "bmp"] },
  tiff: { common: ["png", "jpg"],     more: ["webp"] },
  bmp:  { common: ["png", "jpg"],     more: ["webp"] },
  avif: { common: ["png", "jpg"],     more: ["webp"] },
  ico:  { common: ["png"],            more: ["jpg"] },
  cr2:  { common: ["jpg", "png"],     more: ["tiff"] },
  nef:  { common: ["jpg", "png"],     more: ["tiff"] },

  // Video
  mp4:  { common: ["mp3", "gif"],     more: ["wav", "webm", "mov", "avi", "mkv"] },
  mov:  { common: ["mp4", "mp3"],     more: ["gif", "webm", "mkv"] },
  webm: { common: ["mp4", "mp3"],     more: ["gif", "mkv"] },
  avi:  { common: ["mp4", "mp3"],     more: ["webm", "mkv"] },
  mkv:  { common: ["mp4", "mp3"],     more: ["webm", "gif"] },

  // Audio
  mp3:  { common: ["wav"],            more: ["flac", "ogg", "aac", "m4a", "opus"] },
  wav:  { common: ["mp3"],            more: ["flac", "ogg", "aac", "opus"] },
  flac: { common: ["mp3", "wav"],     more: ["ogg", "aac", "opus"] },
  ogg:  { common: ["mp3"],            more: ["wav", "flac", "opus"] },
  aac:  { common: ["mp3"],            more: ["wav", "flac", "opus"] },
  m4a:  { common: ["mp3"],            more: ["wav", "flac", "ogg"] },
  opus: { common: ["mp3"],            more: ["wav", "flac"] },

  // Data
  csv:     { common: ["json", "xlsx"],    more: ["parquet", "tsv", "sqlite"] },
  xlsx:    { common: ["csv", "json"],     more: ["parquet", "tsv", "sqlite"] },
  json:    { common: ["csv", "xlsx"],     more: ["yaml", "toml", "xml", "tsv", "parquet", "sqlite"] },
  parquet: { common: ["csv", "json"],     more: ["xlsx", "tsv", "sqlite"] },
  tsv:     { common: ["csv", "json"],     more: ["xlsx", "parquet", "sqlite"] },
  yaml:    { common: ["json"],            more: ["toml", "csv", "xml"] },
  yml:     { common: ["json"],            more: ["toml", "csv", "xml"] },
  toml:    { common: ["json", "yaml"],    more: ["csv", "xml"] },
  xml:     { common: ["json", "yaml"],    more: ["csv"] },
  sqlite:  { common: ["csv", "json"],     more: ["xlsx"] },
};

// Flat list for backward compat (hooks use this for validation)
export const FORMAT_MAP: Record<string, string[]> = Object.fromEntries(
  Object.entries(FORMAT_MAP_DETAILED).map(([k, v]) => [k, [...v.common, ...v.more]])
);

export interface FormatGroup {
  label: string;
  formats: string[];
}

export function getGroupedFormats(filename: string): FormatGroup[] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const entry = FORMAT_MAP_DETAILED[ext];
  if (!entry) return [];

  const groups: FormatGroup[] = [
    { label: "Common", formats: entry.common },
  ];
  if (entry.more.length > 0) {
    groups.push({ label: "More", formats: entry.more });
  }
  return groups;
}

export function getOutputFormats(filename: string): string[] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FORMAT_MAP[ext] ?? [];
}

export function getInputExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}
