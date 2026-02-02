import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { BackendCapabilities, InferenceAdapter } from "../lib/inference/types";
import { InferenceError } from "../lib/inference/types";
import { MediaPipeAdapter } from "../lib/inference/mediapipe-adapter";
import { OllamaAdapter } from "../lib/inference/ollama-adapter";
import { modelManager } from "../lib/model-manager";
import { getSetting } from "../lib/db";
import { InferenceContext, type GenerationStats } from "./inference-context";

export function InferenceProvider({ children }: { children: ReactNode }) {
  const adapterRef = useRef<InferenceAdapter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [backend, setBackend] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<BackendCapabilities | null>(null);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFirstGeneration = useRef(true);
  const inferenceSettingsRef = useRef<{
    inferenceBackend: "auto" | "webgpu" | "ollama";
    ollamaBaseUrl: string;
    ollamaModel: string;
    temperature: number;
    topP: number;
  } | null>(null);

  const getInferenceSettings = useCallback(async () => {
    const inferenceBackend = await getSetting<"auto" | "webgpu" | "ollama">("inferenceBackend", "auto");
    const ollamaBaseUrl = await getSetting<string>("ollamaBaseUrl", "http://localhost:11434");
    const ollamaModel = await getSetting<string>("ollamaModel", "llama3.2:3b");
    const temperature = await getSetting<number>("temperature", 0.7);
    const topP = await getSetting<number>("topP", 0.9);

    return { inferenceBackend, ollamaBaseUrl, ollamaModel, temperature, topP };
  }, []);

  const settingsMatch = useCallback(
    (previous: typeof inferenceSettingsRef.current, next: typeof inferenceSettingsRef.current) =>
      !!previous &&
      !!next &&
      previous.inferenceBackend === next.inferenceBackend &&
      previous.ollamaBaseUrl === next.ollamaBaseUrl &&
      previous.ollamaModel === next.ollamaModel &&
      previous.temperature === next.temperature &&
      previous.topP === next.topP,
    [],
  );

  const resetAdapterState = useCallback(async () => {
    if (adapterRef.current?.isInitialized()) {
      await adapterRef.current.unload();
    }
    adapterRef.current = null;
    setModelLoaded(false);
    setLoadedModelId(null);
    setStats(null);
    isFirstGeneration.current = true;
  }, []);

  const applyAdapterCapabilities = useCallback(async (adapter: InferenceAdapter) => {
    const caps = await adapter.getBackendCapabilities();
    adapterRef.current = adapter;
    setBackend(caps.preferredBackend);
    setCapabilities(caps);
  }, []);

  const resolveOllamaModel = useCallback((modelId?: string) => {
    const configuredModel = inferenceSettingsRef.current?.ollamaModel?.trim() ?? "";
    const modelName = modelId?.trim() || configuredModel;
    if (!modelName) {
      throw new Error("No Ollama model configured. Set it in Settings → Inference → Ollama model.");
    }
    return modelName;
  }, []);

  const startOllamaAdapter = useCallback(
    async (settings: NonNullable<typeof inferenceSettingsRef.current>, options?: { loadModel?: boolean }) => {
      setConnecting(true);
      const adapter = new OllamaAdapter(settings.ollamaBaseUrl, settings.ollamaModel);
      await adapter.init();
      await applyAdapterCapabilities(adapter);
      setError(null);

      if (options?.loadModel) {
        const modelName = resolveOllamaModel(settings.ollamaModel);
        await adapter.loadModel(modelName);
        setModelLoaded(true);
        setLoadedModelId(modelName);
        isFirstGeneration.current = true;
      }
      setConnecting(false);
    },
    [applyAdapterCapabilities, resolveOllamaModel],
  );

  const isWebGpuError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return error instanceof InferenceError
      ? error.code === "WEBGPU_NOT_SUPPORTED"
      : message.toLowerCase().includes("webgpu") || message.toLowerCase().includes("gpu");
  }, []);

  const initialize = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);

      const nextSettings = await getInferenceSettings();
      const previousSettings = inferenceSettingsRef.current;

      if (adapterRef.current?.isInitialized() && settingsMatch(previousSettings, nextSettings)) {
        if (!initialized) {
          setInitialized(true);
        }
        return;
      }

      if (adapterRef.current?.isInitialized()) {
        await resetAdapterState();
      }

      inferenceSettingsRef.current = nextSettings;

      if (nextSettings.inferenceBackend === "ollama") {
        await startOllamaAdapter(nextSettings);
      } else {
        const mediapipeAdapter = new MediaPipeAdapter();
        const caps = await mediapipeAdapter.getBackendCapabilities();
        if (nextSettings.inferenceBackend === "auto" && caps.webgpu === false) {
          await startOllamaAdapter(nextSettings);
        } else {
          await mediapipeAdapter.init();
          await applyAdapterCapabilities(mediapipeAdapter);
        }
      }

      setInitialized(true);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setConnecting(false);
    }
  }, [
    applyAdapterCapabilities,
    getInferenceSettings,
    initialized,
    resetAdapterState,
    settingsMatch,
    startOllamaAdapter,
  ]);

  const loadModel = useCallback(
    async (modelId: string) => {
      if (!adapterRef.current) {
        throw new Error("Inference not initialized");
      }

      try {
        setError(null);
        setWarmingUp(true);

        if (adapterRef.current.id === "ollama") {
          const modelName = resolveOllamaModel(modelId);
          if (adapterRef.current.isLoaded()) {
            await adapterRef.current.unload();
          }
          await adapterRef.current.loadModel(modelName);
          setModelLoaded(true);
          setLoadedModelId(modelName);
          isFirstGeneration.current = true;
          return;
        }

        // MediaPipe path: load the model file from IndexedDB.
        const modelBlob = await modelManager.getModelBlob(modelId);
        if (!modelBlob) {
          throw new Error("Model not downloaded. Please import the model file first.");
        }

        if (adapterRef.current.isLoaded()) {
          await adapterRef.current.unload();
        }

        await adapterRef.current.loadModel(modelBlob);
        setModelLoaded(true);
        setLoadedModelId(modelId);
        isFirstGeneration.current = true;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (
          adapterRef.current?.id === "mediapipe" &&
          inferenceSettingsRef.current?.inferenceBackend === "auto" &&
          isWebGpuError(e)
        ) {
          try {
            setConnecting(true);
            const settings = inferenceSettingsRef.current;
            if (!settings) {
              throw new Error("Inference settings not available.");
            }
            await startOllamaAdapter(settings, { loadModel: true });
            setError(null);
            return;
          } catch (fallbackError) {
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            setError(fallbackMessage);
            throw fallbackError;
          } finally {
            setConnecting(false);
          }
        }

        setError(message);
        throw e;
      } finally {
        setWarmingUp(false);
      }
    },
    [isWebGpuError, resolveOllamaModel, startOllamaAdapter],
  );

  const generate = useCallback(
    async (prompt: string, onChunk: (chunk: string) => void): Promise<{ aborted?: boolean }> => {
      if (!adapterRef.current) {
        throw new Error("Inference not initialized");
      }

      setGenerating(true);
      setError(null);

      if (isFirstGeneration.current) {
        setWarmingUp(true);
      }

      abortControllerRef.current = new AbortController();
      const startTime = Date.now();
      let tokensGenerated = 0;
      let aborted = false;

      try {
        const temperature = inferenceSettingsRef.current?.temperature ?? (await getSetting<number>("temperature", 0.7));
        const topP = inferenceSettingsRef.current?.topP ?? (await getSetting<number>("topP", 0.9));

        const generator = adapterRef.current.generate(prompt, {
          signal: abortControllerRef.current.signal,
          temperature,
          topP,
        });

        for await (const chunk of generator) {
          if (isFirstGeneration.current) {
            setWarmingUp(false);
            isFirstGeneration.current = false;
          }
          tokensGenerated++;
          const elapsed = (Date.now() - startTime) / 1000;
          setStats({
            tokensGenerated,
            startTime,
            tokensPerSecond: elapsed > 0 ? tokensGenerated / elapsed : 0,
          });
          onChunk(chunk);
        }
      } catch (e) {
        const err = e as Error;
        if (err.message.includes("aborted")) {
          aborted = true;
        } else {
          setError(err.message);
          throw e;
        }
      } finally {
        setGenerating(false);
        setWarmingUp(false);
        abortControllerRef.current = null;
      }

      return { aborted };
    },
    [],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const unloadModel = useCallback(async () => {
    if (adapterRef.current) {
      await adapterRef.current.unload();
      setModelLoaded(false);
      setLoadedModelId(null);
      setStats(null);
      isFirstGeneration.current = true;
    }
  }, []);

  useEffect(() => {
    return () => {
      adapterRef.current?.unload();
    };
  }, []);

  return (
    <InferenceContext.Provider
      value={{
        initialized,
        modelLoaded,
        loadedModelId,
        generating,
        warmingUp,
        connecting,
        backend,
        capabilities,
        stats,
        error,
        initialize,
        loadModel,
        generate,
        abort,
        unloadModel,
      }}
    >
      {children}
    </InferenceContext.Provider>
  );
}
