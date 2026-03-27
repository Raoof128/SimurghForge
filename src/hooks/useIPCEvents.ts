import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { ProgressEvent, BatchCompleteEvent, ConversionStatus } from "../types/conversion";

interface UseIPCEventsProps {
  onProgress: (
    id: string,
    status: ConversionStatus,
    percent: number,
    errorMsg?: string,
    outputPath?: string
  ) => void;
  onBatchComplete?: (event: BatchCompleteEvent) => void;
}

export function useIPCEvents({ onProgress, onBatchComplete }: UseIPCEventsProps) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<ProgressEvent>("conversion_progress", (event) => {
      const { id, status, percent, errorMsg, outputPath } = event.payload;
      onProgress(id, status, percent, errorMsg, outputPath);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [onProgress]);

  useEffect(() => {
    if (!onBatchComplete) return;
    let unlisten: (() => void) | undefined;
    listen<BatchCompleteEvent>("batch_complete", (event) => {
      onBatchComplete(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [onBatchComplete]);
}
