import { invoke } from "@tauri-apps/api/core";
import type { ConvertBatchPayload } from "../types/conversion";

export async function convertBatch(payload: ConvertBatchPayload): Promise<void> {
  return invoke("convert_batch", { payload });
}

export async function getDefaultOutputDir(): Promise<string> {
  return invoke("get_default_output_dir");
}
