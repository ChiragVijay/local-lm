import { useState, useEffect } from "react";
import { getSetting, setSetting } from "../lib/db";

export type ColorMode = "light" | "dark" | "system";
export type InferenceBackendSetting = "auto" | "webgpu" | "ollama";

export interface AppSettings {
  colorMode: ColorMode;
  selectedModel: string;
  streaming: boolean;
  temperature: number;
  topP: number;
  inferenceBackend: InferenceBackendSetting;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

const defaultSettings: AppSettings = {
  colorMode: "system",
  selectedModel: "",
  streaming: true,
  temperature: 0.7,
  topP: 0.9,
  inferenceBackend: "auto",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "llama3.2:3b",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const colorMode = await getSetting<AppSettings["colorMode"]>("colorMode", "system");
      const selectedModel = await getSetting<string>("selectedModel", "");
      const streaming = await getSetting<boolean>("streaming", true);
      const temperature = await getSetting<number>("temperature", 0.7);
      const topP = await getSetting<number>("topP", 0.9);
      const inferenceBackend = await getSetting<AppSettings["inferenceBackend"]>("inferenceBackend", "auto");
      const ollamaBaseUrl = await getSetting<AppSettings["ollamaBaseUrl"]>("ollamaBaseUrl", "http://localhost:11434");
      const ollamaModel = await getSetting<AppSettings["ollamaModel"]>("ollamaModel", "llama3.2:3b");

      setSettings({
        colorMode,
        selectedModel,
        streaming,
        temperature,
        topP,
        inferenceBackend,
        ollamaBaseUrl,
        ollamaModel,
      });
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    await setSetting(key, value as string | number | boolean);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    isLoading,
    updateSetting,
  };
}
