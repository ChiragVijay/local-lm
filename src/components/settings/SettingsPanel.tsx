import { useState, useEffect, useCallback } from "react";
import { Palette, HelpCircle, BarChart3, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { useSettings } from "../../hooks/useSettings";
import { useTheme } from "../../contexts/theme-context";
import { Toggle } from "../ui/Toggle";
import { Slider } from "../ui/Slider";
import { Tooltip } from "../ui/Tooltip";
import { StatsPanel } from "../StatsPanel";
import { ThemeDropdown } from "./ThemeDropdown";

export function SettingsPanel() {
  const { settings, updateSetting, isLoading } = useSettings();
  const { variant, mode, setTheme } = useTheme();
  const [statsOpen, setStatsOpen] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  const openStats = () => setStatsOpen(true);
  const closeStats = () => setStatsOpen(false);

  const joinUrl = (baseUrl: string, path: string) => {
    const base = baseUrl.replace(/\/+$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  };

  const fetchOllamaModels = useCallback(async () => {
    setOllamaLoading(true);
    setOllamaError(null);
    try {
      const baseUrl = settings.ollamaBaseUrl.trim() || "http://localhost:11434";
      const res = await fetch(joinUrl(baseUrl, "/api/tags"), { method: "GET" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
      }
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const models = (data.models ?? [])
        .map((model) => model.name)
        .filter(Boolean)
        .sort();
      setOllamaModels(models);
      if (models.length === 0) {
        setOllamaError("No local models found. Run: ollama pull <model>");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOllamaModels([]);
      setOllamaError(`Failed to fetch models: ${message}`);
    } finally {
      setOllamaLoading(false);
    }
  }, [settings.ollamaBaseUrl]);

  useEffect(() => {
    fetchOllamaModels();
  }, [fetchOllamaModels]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-lg mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your preferences</p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-[11px] font-semibold text-muted-foreground uppercase tracking-widest u-divider inline-block">
            Appearance
          </h2>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground">Choose your color scheme</p>
                </div>
              </div>
              <ThemeDropdown value={variant} onChange={(v) => setTheme(v, mode)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-[11px] font-semibold text-muted-foreground uppercase tracking-widest u-divider inline-block">
            Inference
          </h2>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Backend</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Auto uses WebGPU when available, otherwise falls back to Ollama (CPU server).
                </p>
              </div>
              <select
                value={settings.inferenceBackend}
                onChange={(e) => updateSetting("inferenceBackend", e.target.value as typeof settings.inferenceBackend)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-sm",
                  "bg-muted text-foreground",
                  "border border-border outline-none",
                  "focus:ring-1 focus:ring-accent/30",
                )}
              >
                <option value="auto">Auto (WebGPU → Ollama fallback)</option>
                <option value="webgpu">WebGPU (browser)</option>
                <option value="ollama">Ollama (CPU server)</option>
              </select>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Ollama (CPU) settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requires a local Ollama server. Default URL is{" "}
                  <span className="font-mono">http://localhost:11434</span>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">Server URL</label>
                <input
                  value={settings.ollamaBaseUrl}
                  onChange={(e) => updateSetting("ollamaBaseUrl", e.target.value)}
                  placeholder="http://localhost:11434"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-sm",
                    "bg-muted text-foreground",
                    "border border-border outline-none",
                    "focus:ring-1 focus:ring-accent/30",
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">Model name</label>
                <input
                  value={settings.ollamaModel}
                  onChange={(e) => updateSetting("ollamaModel", e.target.value)}
                  placeholder='e.g. "llama3.2:3b"'
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-sm",
                    "bg-muted text-foreground",
                    "border border-border outline-none",
                    "focus:ring-1 focus:ring-accent/30",
                  )}
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Run <span className="font-mono">ollama pull {settings.ollamaModel || "llama3.2:3b"}</span> once, then
                  chat as usual.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-muted-foreground">Available models</label>
                  <button
                    type="button"
                    onClick={fetchOllamaModels}
                    className={cn(
                      "text-[11px] font-medium",
                      "text-accent hover:text-accent/80 transition-colors",
                      ollamaLoading && "opacity-60 cursor-wait",
                    )}
                    disabled={ollamaLoading}
                  >
                    {ollamaLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>
                <select
                  value={settings.ollamaModel}
                  onChange={(e) => updateSetting("ollamaModel", e.target.value)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-sm",
                    "bg-muted text-foreground",
                    "border border-border outline-none",
                    "focus:ring-1 focus:ring-accent/30",
                  )}
                >
                  <option value="">Select an Ollama model</option>
                  {ollamaModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {ollamaError ? ollamaError : "Click refresh to pull models from your local Ollama server."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Stream responses</p>
                <p className="text-xs text-muted-foreground mt-0.5">Show tokens as they generate</p>
              </div>
              <Toggle checked={settings.streaming} onChange={(v) => updateSetting("streaming", v)} />
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Temperature</p>
                  <Tooltip text="Lower = more predictable. Higher = more creative and varied.">
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-accent cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {settings.temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                value={settings.temperature}
                min={0}
                max={2}
                step={0.1}
                onChange={(v) => updateSetting("temperature", v)}
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Top-P</p>
                  <Tooltip text="Lower = stick to the most likely words. Higher = consider more options.">
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-accent cursor-help transition-colors" />
                  </Tooltip>
                </div>
                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {settings.topP.toFixed(2)}
                </span>
              </div>
              <Slider value={settings.topP} min={0} max={1} step={0.05} onChange={(v) => updateSetting("topP", v)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-[11px] font-semibold text-muted-foreground uppercase tracking-widest u-divider inline-block">
            Data
          </h2>

          <div className="rounded-lg border border-border bg-card p-4">
            <button
              onClick={openStats}
              className={cn("w-full flex items-center justify-between group", "transition-colors")}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Usage Statistics
                  </p>
                  <p className="text-xs text-muted-foreground">View your all-time stats</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-[11px] font-semibold text-muted-foreground uppercase tracking-widest u-divider inline-block">
            About
          </h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              LocalLM can run models in your browser using WebGPU acceleration, or fall back to a local CPU server
              (Ollama) on machines without WebGPU. Your conversations are stored locally and never leave your device.
            </p>
          </div>
        </section>
      </div>

      <StatsPanel isOpen={statsOpen} onClose={closeStats} />
    </div>
  );
}
