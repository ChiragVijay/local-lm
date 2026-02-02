import type { BackendCapabilities, GenerateOptions, InferenceAdapter, ModelLoadOptions } from "./types";
import { InferenceError } from "./types";

type OllamaGenerateRequest = {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    seed?: number;
  };
};

type OllamaGenerateStreamChunk = {
  response?: string;
  done?: boolean;
  error?: string;
};

type OllamaTagsResponse = {
  models?: Array<{ name: string }>;
};

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export class OllamaAdapter implements InferenceAdapter {
  id = "ollama";
  name = "Ollama (local CPU server)";

  private baseUrl: string;
  private modelName: string | null;
  private initialized = false;
  private modelLoaded = false;

  constructor(baseUrl: string, modelName?: string) {
    this.baseUrl = baseUrl;
    this.modelName = modelName?.trim() ? modelName.trim() : null;
  }

  async getBackendCapabilities(): Promise<BackendCapabilities> {
    return {
      webgpu: false,
      wasm: false,
      server: true,
      preferredBackend: "server",
    };
  }

  async init(): Promise<void> {
    const tagsUrl = joinUrl(this.baseUrl, "/api/tags");
    try {
      const res = await fetch(tagsUrl, { method: "GET" });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new InferenceError(
          `Failed to contact Ollama at ${this.baseUrl} (GET /api/tags). HTTP ${res.status}. ${body ? JSON.stringify(body) : ""}`.trim(),
          "NOT_INITIALIZED",
        );
      }
      this.initialized = true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to contact Ollama at ${this.baseUrl}: ${String(error)}`;
      throw new InferenceError(
        [
          "Could not connect to the local CPU inference server (Ollama).",
          `Tried: ${tagsUrl}`,
          message,
          "Make sure Ollama is running and reachable from the browser.",
        ].join(" "),
        "NOT_INITIALIZED",
        error,
      );
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async loadModel(modelSource: string | Blob, options?: ModelLoadOptions): Promise<void> {
    void options;
    if (!this.initialized) {
      throw new InferenceError("Adapter not initialized. Call init() first.", "NOT_INITIALIZED");
    }
    if (modelSource instanceof Blob) {
      throw new InferenceError(
        "Ollama adapter does not support loading model files in the browser.",
        "MODEL_LOAD_FAILED",
      );
    }

    const modelName = modelSource.trim();
    if (!modelName) {
      throw new InferenceError("No Ollama model name configured.", "MODEL_LOAD_FAILED");
    }

    // Best-effort check that the model exists locally.
    const tagsUrl = joinUrl(this.baseUrl, "/api/tags");
    try {
      const res = await fetch(tagsUrl, { method: "GET" });
      if (res.ok) {
        const json = (await res.json()) as OllamaTagsResponse;
        const exists = (json.models ?? []).some((m) => m.name === modelName);
        if (!exists) {
          throw new InferenceError(
            `Ollama model "${modelName}" not found locally. Run: ollama pull ${modelName}`,
            "MODEL_NOT_FOUND",
          );
        }
      }
    } catch (e) {
      if (e instanceof InferenceError) throw e;
      // If tags check fails for any reason, still allow generation to attempt.
    }

    this.modelName = modelName;
    this.modelLoaded = true;
  }

  isLoaded(): boolean {
    return this.modelLoaded;
  }

  async *generate(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    if (!this.initialized) {
      throw new InferenceError("Adapter not initialized. Call init() first.", "NOT_INITIALIZED");
    }
    if (!this.modelName) {
      throw new InferenceError("No model loaded. Configure an Ollama model name first.", "NOT_INITIALIZED");
    }

    const url = joinUrl(this.baseUrl, "/api/generate");
    const body: OllamaGenerateRequest = {
      model: this.modelName,
      prompt,
      stream: true,
      options: {
        temperature: options?.temperature,
        top_p: options?.topP,
        top_k: options?.topK,
        num_predict: options?.maxTokens,
        seed: options?.randomSeed,
      },
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options?.signal,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("aborted")) {
        throw new InferenceError("Generation aborted", "GENERATION_ABORTED", error);
      }
      throw new InferenceError(`Failed to call Ollama: ${message}`, "GENERATION_FAILED", error);
    }

    if (!res.ok) {
      const errBody = await safeJson(res);
      throw new InferenceError(
        `Ollama error (HTTP ${res.status}): ${errBody ? JSON.stringify(errBody) : "Unknown error"}`,
        "GENERATION_FAILED",
      );
    }

    if (!res.body) {
      throw new InferenceError("Ollama response body was empty.", "GENERATION_FAILED");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const newlineIdx = buffer.indexOf("\n");
          if (newlineIdx === -1) break;

          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (!line) continue;

          let parsed: OllamaGenerateStreamChunk | null = null;
          try {
            parsed = JSON.parse(line) as OllamaGenerateStreamChunk;
          } catch {
            continue;
          }

          if (parsed.error) {
            throw new InferenceError(`Ollama error: ${parsed.error}`, "GENERATION_FAILED");
          }

          if (parsed.response) {
            yield parsed.response;
          }

          if (parsed.done) {
            return;
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("aborted")) {
        throw new InferenceError("Generation aborted", "GENERATION_ABORTED", error);
      }
      if (error instanceof InferenceError) throw error;
      throw new InferenceError(`Generation failed: ${message}`, "GENERATION_FAILED", error);
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // ignore
      }
    }
  }

  async unload(): Promise<void> {
    this.modelLoaded = false;
    this.modelName = null;
  }
}
