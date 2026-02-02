import { Check, Loader2, Trash2, Play, ExternalLink, Upload } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CatalogModel } from "../../lib/models/catalog";

interface ModelRowProps {
  model: CatalogModel;
  isDownloaded: boolean;
  isLoaded: boolean;
  isImporting: boolean;
  onSelect: () => void;
  onLoad: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onImport: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ModelRow({
  model,
  isDownloaded,
  isLoaded,
  isImporting,
  onSelect,
  onLoad,
  onDelete,
  onImport,
}: ModelRowProps) {
  return (
    <div
      onClick={isDownloaded ? onSelect : undefined}
      className={cn(
        "w-full flex items-center justify-between rounded-md px-3 py-2.5",
        "text-left transition-colors",
        isLoaded ? "bg-accent/10" : isDownloaded ? "hover:bg-muted cursor-pointer" : "opacity-90",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("font-display text-sm font-medium truncate", isLoaded && "text-accent")}>{model.name}</p>
          {isLoaded ? (
            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
              Active
            </span>
          ) : isDownloaded ? (
            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
              Ready
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {model.family} · {model.size} · {model.quantization}
        </p>
        {isImporting && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin text-accent" />
            <span>Importing...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-2">
        {isLoaded ? (
          <Check className="w-4 h-4 text-accent" />
        ) : isDownloaded ? (
          <>
            <button
              onClick={onLoad}
              className="p-1.5 rounded-md hover:bg-accent/10 text-accent transition-colors"
              title="Load model"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
              title="Delete model"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : isImporting ? (
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
        ) : (
          <>
            <a
              href={model.huggingFaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Download from HuggingFace"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onImport}
              className="p-1.5 rounded-md hover:bg-accent/10 text-accent transition-colors"
              title="Import downloaded file"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
