import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";
import type {
  BackendCapabilities,
  BackendType,
  GenerateOptions,
  InferenceAdapter,
  InferenceErrorCode,
  ModelLoadOptions,
} from "./types";
import { InferenceError } from "./types";

let webgpuSupportPromise: Promise<boolean> | null = null;

async function checkWebGPUSupportCached(): Promise<boolean> {
  if (webgpuSupportPromise) return webgpuSupportPromise;

  webgpuSupportPromise = (async () => {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  })();

  return webgpuSupportPromise;
}

function classifyError(error: unknown): {
  code: InferenceErrorCode;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("not found") || lowerMessage.includes("404")) {
    return {
      code: "MODEL_NOT_FOUND",
      message: `Model file not found: ${message}`,
    };
  }
  if (lowerMessage.includes("out of memory") || lowerMessage.includes("oom")) {
    return { code: "OUT_OF_MEMORY", message: `Out of memory: ${message}` };
  }
  if (lowerMessage.includes("webgpu") || lowerMessage.includes("gpu")) {
    return {
      code: "WEBGPU_NOT_SUPPORTED",
      message: `WebGPU error: ${message}`,
    };
  }
  if (lowerMessage.includes("abort")) {
    return { code: "GENERATION_ABORTED", message: "Generation was aborted" };
  }

  return { code: "UNKNOWN", message };
}

export class MediaPipeAdapter implements InferenceAdapter {
  id = "mediapipe";
  name = "MediaPipe LLM Inference";

  private llmInference: LlmInference | null = null;
  private genaiFileset: unknown = null;
  private modelLoaded = false;
  private currentBackend: BackendType | null = null;
  private capabilities: BackendCapabilities | null = null;

  async getBackendCapabilities(): Promise<BackendCapabilities> {
    if (this.capabilities) return this.capabilities;

    // On Web, MediaPipe LLM Inference requires WebGPU. Without it, model loading cannot proceed.
    const webgpu = await checkWebGPUSupportCached();
    this.capabilities = {
      webgpu,
      wasm: false,
      server: false,
      preferredBackend: "webgpu",
    };
    this.currentBackend = "webgpu";
    return this.capabilities;
  }

  async init(): Promise<void> {
    try {
      this.genaiFileset = await FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm",
      );
    } catch (error) {
      const { code, message } = classifyError(error);
      throw new InferenceError(message, code, error);
    }
  }

  isInitialized(): boolean {
    return this.genaiFileset !== null;
  }

  async loadModel(modelSource: string | Blob, options?: ModelLoadOptions): Promise<void> {
    if (!this.genaiFileset) {
      throw new InferenceError("Adapter not initialized. Call init() first.", "NOT_INITIALIZED");
    }

    try {
      const caps = await this.getBackendCapabilities();
      if (!caps.webgpu) {
        throw new InferenceError(
          [
            "Failed to load model: WebGPU is required in this browser, but it is not available.",
            "Enable WebGPU / hardware acceleration or use a WebGPU-compatible browser and GPU drivers.",
          ].join(" "),
          "WEBGPU_NOT_SUPPORTED",
        );
      }

      let baseOptions: {
        modelAssetPath?: string;
        modelAssetBuffer?: ReadableStreamDefaultReader<Uint8Array>;
      };

      if (modelSource instanceof Blob) {
        const stream = modelSource.stream();
        const reader = stream.getReader();
        baseOptions = { modelAssetBuffer: reader };
      } else {
        baseOptions = { modelAssetPath: modelSource };
      }

      this.llmInference = await LlmInference.createFromOptions(
        this.genaiFileset as Parameters<typeof LlmInference.createFromOptions>[0],
        {
          baseOptions,
          maxTokens: options?.maxTokens ?? 2048,
          topK: options?.topK ?? 40,
          temperature: options?.temperature ?? 0.8,
          randomSeed: options?.randomSeed ?? 101,
        },
      );
      this.modelLoaded = true;
    } catch (error) {
      if (error instanceof InferenceError) throw error;
      const { code, message } = classifyError(error);
      throw new InferenceError(`Failed to load model: ${message}`, code, error);
    }
  }

  async *generate(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    if (!this.llmInference) {
      throw new InferenceError("No model loaded. Call loadModel() first.", "NOT_INITIALIZED");
    }

    let resolve: ((value: string | null) => void) | null = null;
    let reject: ((error: Error) => void) | null = null;
    const queue: string[] = [];
    let done = false;
    let error: Error | null = null;

    const abortHandler = () => {
      error = new InferenceError("Generation aborted", "GENERATION_ABORTED");
      done = true;
      if (resolve) resolve(null);
    };

    options?.signal?.addEventListener("abort", abortHandler);

    const streamingCallback = (partialResult: string, complete: boolean) => {
      if (complete) {
        done = true;
        if (resolve) resolve(null);
      } else {
        queue.push(partialResult);
        if (resolve) {
          resolve(queue.shift()!);
          resolve = null;
        }
      }
    };

    this.llmInference.generateResponse(prompt, streamingCallback).catch((e) => {
      const { code, message } = classifyError(e);
      error = new InferenceError(message, code, e);
      done = true;
      if (reject) reject(error);
    });

    try {
      while (!done || queue.length > 0) {
        if (error) throw error;

        if (queue.length > 0) {
          yield queue.shift()!;
        } else if (!done) {
          const result = await new Promise<string | null>((res, rej) => {
            resolve = res;
            reject = rej;
          });
          if (result !== null) {
            yield result;
          }
        }
      }
    } finally {
      options?.signal?.removeEventListener("abort", abortHandler);
    }
  }

  async unload(): Promise<void> {
    if (this.llmInference) {
      this.llmInference.close();
      this.llmInference = null;
      this.modelLoaded = false;
    }
  }

  isLoaded(): boolean {
    return this.modelLoaded;
  }

  getBackend(): BackendType | null {
    return this.currentBackend;
  }
}
