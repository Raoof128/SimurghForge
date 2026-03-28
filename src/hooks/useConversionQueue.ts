import { useReducer, useCallback } from "react";
import type { FileItem, ConversionStatus } from "../types/conversion";
import { getInputExtension, getOutputFormats } from "../lib/formatMap";

type QueueAction =
  | { type: "ADD_FILES"; files: FileItem[] }
  | { type: "REMOVE_FILE"; id: string }
  | { type: "CLEAR_QUEUE" }
  | { type: "SET_OUTPUT_FORMAT"; id: string; format: string }
  | {
      type: "UPDATE_PROGRESS";
      id: string;
      status: ConversionStatus;
      percent: number;
      errorMsg?: string;
      outputPath?: string;
    }
  | { type: "RESET_FILE"; id: string }
  | { type: "UPDATE_SIZE"; path: string; size: number };

function queueReducer(state: FileItem[], action: QueueAction): FileItem[] {
  switch (action.type) {
    case "ADD_FILES": {
      const existingPaths = new Set(state.map((f) => f.path));
      const unique = action.files.filter((f) => !existingPaths.has(f.path));
      const capacity = Math.max(0, 50 - state.length);
      return [...state, ...unique.slice(0, capacity)];
    }
    case "REMOVE_FILE":
      return state.filter((f) => f.id !== action.id);
    case "CLEAR_QUEUE":
      return [];
    case "SET_OUTPUT_FORMAT":
      return state.map((f) =>
        f.id === action.id ? { ...f, outputFormat: action.format } : f
      );
    case "UPDATE_PROGRESS":
      return state.map((f) =>
        f.id === action.id
          ? {
              ...f,
              status: action.status,
              percent: action.percent,
              errorMsg: action.errorMsg,
              outputPath: action.outputPath,
            }
          : f
      );
    case "RESET_FILE":
      return state.map((f) =>
        f.id === action.id
          ? { ...f, status: "queued", percent: 0, errorMsg: undefined, outputPath: undefined }
          : f
      );
    case "UPDATE_SIZE":
      return state.map((f) =>
        f.path === action.path ? { ...f, size: action.size } : f
      );
    default:
      return state;
  }
}

export function useConversionQueue() {
  const [files, dispatch] = useReducer(queueReducer, []);

  const addFiles = useCallback(
    (paths: string[]): { attempted: number; unsupported: number } => {
      const newFiles: FileItem[] = [];
      let unsupported = 0;
      for (const path of paths) {
        const name = path.split("/").pop() ?? path;
        const ext = getInputExtension(name);
        const formats = getOutputFormats(name);
        if (formats.length === 0) {
          unsupported++;
          continue;
        }
        newFiles.push({
          id: crypto.randomUUID(),
          name,
          path,
          size: 0,
          inputFormat: ext,
          outputFormat: formats[0],
          status: "queued",
          percent: 0,
        });
      }
      if (newFiles.length > 0) {
        dispatch({ type: "ADD_FILES", files: newFiles });
      }
      return { attempted: paths.length, unsupported };
    },
    []
  );

  const removeFile = useCallback(
    (id: string) => dispatch({ type: "REMOVE_FILE", id }),
    []
  );

  const clearQueue = useCallback(
    () => dispatch({ type: "CLEAR_QUEUE" }),
    []
  );

  const setOutputFormat = useCallback(
    (id: string, format: string) =>
      dispatch({ type: "SET_OUTPUT_FORMAT", id, format }),
    []
  );

  const updateProgress = useCallback(
    (
      id: string,
      status: ConversionStatus,
      percent: number,
      errorMsg?: string,
      outputPath?: string
    ) => dispatch({ type: "UPDATE_PROGRESS", id, status, percent, errorMsg, outputPath }),
    []
  );

  const resetFile = useCallback(
    (id: string) => dispatch({ type: "RESET_FILE", id }),
    []
  );

  const updateSize = useCallback(
    (path: string, size: number) => dispatch({ type: "UPDATE_SIZE", path, size }),
    []
  );

  return {
    files,
    addFiles,
    removeFile,
    clearQueue,
    setOutputFormat,
    updateProgress,
    resetFile,
    updateSize,
  };
}
