import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Cpu, Loader2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { cn } from "../../lib/utils";
import { useSettings } from "../../hooks/useSettings";
import { MODEL_CATALOG, type CatalogModel } from "../../lib/models/catalog";
import { modelManager, type DownloadProgress } from "../../lib/model-manager";
import { useInference } from "../../contexts/inference-context";
import { useClickOutside } from "../../hooks/useClickOutside";
import { db } from "../../lib/db";
import { ModelRow } from "./ModelRow";

interface ModelSelectorProps {
  compact?: boolean;
}

export function ModelSelector({ compact }: ModelSelectorProps) {
  const { settings, updateSetting } = useSettings();
  const inference = useInference();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<Map<string, DownloadProgress>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingModelIdRef = useRef<string | null>(null);

  const downloadedModels = useLiveQuery(
    async () => {
      const all = await db.models.toArray();
      return all.filter((m) => m.downloaded === true);
    },
    [],
    [],
  );
  const downloadedIds = useMemo(() => new Set(downloadedModels.map((m) => m.id)), [downloadedModels]);

  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false);
      setSearch("");
    },
    isOpen,
  );

  useEffect(() => {
    const unsubscribes = MODEL_CATALOG.map((model) =>
      modelManager.onProgress(model.id, (progress) => {
        setImportProgress((prev) => new Map(prev).set(model.id, progress));
      }),
    );
    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  const selectedModel = MODEL_CATALOG.find((m) => m.id === settings.selectedModel);

  const filteredModels = useMemo(
    () =>
      MODEL_CATALOG.filter(
        (model) =>
          model.name.toLowerCase().includes(search.toLowerCase()) ||
          model.family.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleImportClick = (modelId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    pendingModelIdRef.current = modelId;
    setActiveImportId(modelId);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const modelId = pendingModelIdRef.current;
    if (!file || !modelId) {
      setActiveImportId(null);
      pendingModelIdRef.current = null;
      return;
    }

    try {
      await modelManager.importModelFile(modelId, file);
    } catch (error) {
      console.error("Failed to import model:", error);
      alert(`Failed to import model: ${(error as Error).message}`);
    } finally {
      setActiveImportId(null);
      pendingModelIdRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (modelId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    await modelManager.deleteModel(modelId);
    if (inference.loadedModelId === modelId) {
      await inference.unloadModel();
    }
  };

  const handleLoad = async (modelId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      if (!inference.initialized) {
        await inference.initialize();
      }
      await inference.loadModel(modelId);
      await updateSetting("selectedModel", modelId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to load model:", error);
      alert(`Failed to load model: ${(error as Error).message}`);
    }
  };

  const handleSelect = async (model: CatalogModel) => {
    const isDownloaded = downloadedIds.has(model.id);
    if (!isDownloaded) return;

    try {
      await updateSetting("selectedModel", model.id);

      if (!inference.initialized) {
        await inference.initialize();
      }
      await inference.loadModel(model.id);
      setIsOpen(false);
      setSearch("");
    } catch (error) {
      console.error("Failed to load model:", error);
      alert(`Failed to load model: ${(error as Error).message}`);
    }
  };

  const loadedModel = inference.loadedModelId
    ? MODEL_CATALOG.find((m) => m.id === inference.loadedModelId)?.name || inference.loadedModelId
    : null;
  const webgpuLabel = loadedModel || selectedModel?.name || "Select model";
  const configuredOllamaModel = settings.ollamaModel?.trim();
  const ollamaLabel = configuredOllamaModel ? `Ollama: ${configuredOllamaModel}` : "Ollama (CPU)";
  const ollamaActiveLabel = inference.loadedModelId ? `Ollama: ${inference.loadedModelId}` : ollamaLabel;
  const useOllama = settings.inferenceBackend === "ollama" || inference.backend === "server";

  const handleOllamaClick = async () => {
    try {
      if (!inference.initialized || inference.backend !== "server") {
        await inference.initialize();
      }
      if (!configuredOllamaModel) {
        alert("No Ollama model configured. Set it in Settings → Inference → Ollama model.");
        return;
      }
      await inference.loadModel(configuredOllamaModel);
    } catch (error) {
      console.error("Failed to initialize Ollama:", error);
      alert(`Failed to initialize Ollama: ${(error as Error).message}`);
    }
  };

  if (useOllama) {
    return (
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 rounded-md",
          "text-sm text-foreground",
          "hover:bg-muted transition-colors",
          compact ? "px-2 py-1.5" : "px-3 py-1.5 border border-border bg-card",
        )}
        title="Initialize Ollama using the configured model"
        onClick={handleOllamaClick}
      >
        <Cpu className="w-3.5 h-3.5 text-accent" />
        <span className="font-display text-xs font-medium">{ollamaActiveLabel}</span>
        {inference.generating && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".task,.litertlm,.bin"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md",
          "text-sm text-foreground",
          "hover:bg-muted transition-colors",
          compact ? "px-2 py-1.5" : "px-3 py-1.5 border border-border bg-card",
        )}
      >
        <Cpu className="w-3.5 h-3.5 text-accent" />
        <span className="font-display text-xs font-medium">{webgpuLabel}</span>
        {inference.generating && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full left-0 mb-2 w-80 z-50",
            "bg-popover border border-border rounded-lg shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-100",
          )}
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className={cn(
                  "w-full pl-8 pr-3 py-2 rounded-md",
                  "bg-muted text-sm text-foreground",
                  "placeholder:text-muted-foreground",
                  "outline-none focus:ring-1 focus:ring-accent/30",
                )}
              />
            </div>
          </div>

          <div className="p-2 border-b border-border bg-muted/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Models require manual download from HuggingFace (free account required). Click the link icon to download,
              then import the file.
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin p-1.5">
            {filteredModels.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No models found</p>
            ) : (
              filteredModels.map((model) => {
                const isDownloaded = downloadedIds.has(model.id);
                const isLoaded = inference.loadedModelId === model.id;
                const progress = importProgress.get(model.id);
                const isImporting = progress?.status === "importing" || activeImportId === model.id;

                return (
                  <ModelRow
                    key={model.id}
                    model={model}
                    isDownloaded={isDownloaded}
                    isLoaded={isLoaded}
                    isImporting={isImporting}
                    onSelect={() => handleSelect(model)}
                    onLoad={(e) => handleLoad(model.id, e)}
                    onDelete={(e) => handleDelete(model.id, e)}
                    onImport={(e) => handleImportClick(model.id, e)}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
