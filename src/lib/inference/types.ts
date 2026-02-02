export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  randomSeed?: number;
  signal?: AbortSignal;
}

export interface ModelLoadOptions {
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  randomSeed?: number;
}

export type BackendType = "webgpu" | "wasm" | "server";

export interface BackendCapabilities {
  webgpu: boolean;
  wasm: boolean;
  server: boolean;
  preferredBackend: BackendType;
}

export interface InferenceAdapter {
  id: string;
  name: string;
  init(): Promise<void>;
  loadModel(modelSource: string | Blob, options?: ModelLoadOptions): Promise<void>;
  generate(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
  unload(): Promise<void>;
  isLoaded(): boolean;
  isInitialized(): boolean;
  getBackendCapabilities(): Promise<BackendCapabilities>;
}

export class InferenceError extends Error {
  code: InferenceErrorCode;
  override cause?: unknown;

  constructor(message: string, code: InferenceErrorCode, cause?: unknown) {
    super(message);
    this.name = "InferenceError";
    this.code = code;
    this.cause = cause;
  }
}

export type InferenceErrorCode =
  | "NOT_INITIALIZED"
  | "MODEL_NOT_FOUND"
  | "MODEL_LOAD_FAILED"
  | "OUT_OF_MEMORY"
  | "WEBGPU_NOT_SUPPORTED"
  | "GENERATION_FAILED"
  | "GENERATION_ABORTED"
  | "UNKNOWN";
