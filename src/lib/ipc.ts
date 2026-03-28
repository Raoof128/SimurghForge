import { invoke } from "@tauri-apps/api/core";
import type { ConvertBatchPayload, AppSettings } from "../types/conversion";

export async function convertBatch(payload: ConvertBatchPayload): Promise<void> {
  return invoke("convert_batch", { payload });
}

export async function getDefaultOutputDir(): Promise<string> {
  return invoke("get_default_output_dir");
}

export async function getFileInfo(paths: string[]): Promise<{ path: string; size: number }[]> {
  return invoke("get_file_info", { paths });
}

export async function openFolder(path: string): Promise<void> {
  return invoke("open_folder", { path });
}

export async function openFile(path: string): Promise<void> {
  // macOS `open` command works for both files and folders
  return invoke("open_folder", { path });
}

export async function loadSettings(): Promise<Partial<AppSettings>> {
  const json: string = await invoke("load_settings");
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { json: JSON.stringify(settings) });
}
