import { createContext, useContext } from "react";
import type { BackendCapabilities } from "../lib/inference/types";

export interface GenerationStats {
  tokensGenerated: number;
  startTime: number;
  tokensPerSecond: number;
}

export interface InferenceContextValue {
  initialized: boolean;
  modelLoaded: boolean;
  loadedModelId: string | null;
  generating: boolean;
  warmingUp: boolean;
  connecting: boolean;
  backend: string | null;
  capabilities: BackendCapabilities | null;
  stats: GenerationStats | null;
  error: string | null;

  initialize: () => Promise<void>;
  loadModel: (modelId: string) => Promise<void>;
  generate: (prompt: string, onChunk: (chunk: string) => void) => Promise<{ aborted?: boolean }>;
  abort: () => void;
  unloadModel: () => Promise<void>;
}

export const InferenceContext = createContext<InferenceContextValue | null>(null);

export function useInference(): InferenceContextValue {
  const context = useContext(InferenceContext);
  if (!context) {
    throw new Error("useInference must be used within InferenceProvider");
  }
  return context;
}
