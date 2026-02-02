import { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { cn } from "../lib/utils";
import { ModelSelector } from "./models";

interface MessageComposerProps {
  onSend: (content: string) => Promise<unknown>;
  onAbort?: () => void;
  isSending: boolean;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function MessageComposer({ onSend, onAbort, isSending, isStreaming, disabled }: MessageComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleSubmit = async () => {
    if (!value.trim() || isSending || disabled) return;
    const content = value;
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSend(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim() && !isSending && !disabled;
  const showAbort = isStreaming && onAbort;

  return (
    <div className="shrink-0 flex items-end justify-center pb-6 px-4">
      <div className="w-full max-w-2xl">
        <div
          className={cn(
            "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
            "transition-all duration-150",
            "focus-within:border-accent/50",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message LocalLM..."
            disabled={isSending || disabled}
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent px-1 py-1 outline-none",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "min-h-[24px] max-h-[160px]",
            )}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ModelSelector compact />
              <button
                type="button"
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center",
                  "text-muted-foreground hover:text-foreground hover:bg-muted",
                  "transition-colors",
                )}
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {showAbort ? (
              <button
                onClick={onAbort}
                className={cn(
                  "shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                  "bg-destructive text-white hover:bg-destructive/90",
                  "transition-all duration-150",
                )}
                title="Stop generating"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSend}
                className={cn(
                  "shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                  "transition-all duration-150",
                  canSend
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-2.5">
          <span className="font-mono text-[10px]">↵</span> send · <span className="font-mono text-[10px]">⇧↵</span> new
          line
        </p>
      </div>
    </div>
  );
}
