import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { useInference } from "../../contexts/inference-context";
import { useSettings } from "../../hooks/useSettings";
import type { Message } from "../../lib/db";
import { MessageBubble, type GenerationMeta } from "./MessageBubble";
import { GenerationStatus } from "./GenerationStatus";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent?: string;
}

export function MessageList({ messages, isStreaming, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { stats, warmingUp, error, initialize, loadModel } = useInference();
  const { settings, updateSetting } = useSettings();

  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevStreamingRef = useRef(isStreaming);
  const prevStatsRef = useRef(stats);

  const isWebGpuError = error ? error.toLowerCase().includes("webgpu") || error.toLowerCase().includes("gpu") : false;
  const showOllamaRetry = settings.inferenceBackend === "auto" && !!error && isWebGpuError;

  const handleRetryWithOllama = async () => {
    try {
      const modelName = settings.ollamaModel.trim();
      if (!modelName) {
        alert("No Ollama model configured. Set it in Settings → Inference → Ollama model.");
        return;
      }
      await updateSetting("inferenceBackend", "ollama");
      await initialize();
      await loadModel(modelName);
    } catch (retryError) {
      console.error("Failed to retry with Ollama:", retryError);
      alert(`Failed to retry with Ollama: ${(retryError as Error).message}`);
    }
  };

  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    const currentStats = prevStatsRef.current;

    if (wasStreaming && !isStreaming && currentStats) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        setGenerationMeta({
          messageId: lastMessage.id,
          tokensPerSecond: currentStats.tokensPerSecond,
          tokenCount: currentStats.tokensGenerated,
        });
      }
    }

    prevStreamingRef.current = isStreaming;
    prevStatsRef.current = stats;
  }, [isStreaming, messages, stats]);

  const updateIsAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const threshold = 48;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(isStreaming ? "auto" : "smooth");
    }
  }, [messages, isStreaming, streamingContent, isAtBottom, scrollToBottom]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="font-display text-xl font-bold text-foreground tracking-tight mb-2">Ready to chat</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start typing to begin. Everything runs on your device — completely private.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} onScroll={updateIsAtBottom} className="relative flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => {
          const isLastAssistant = index === messages.length - 1 && message.role === "assistant";
          const showStreaming = isLastAssistant && isStreaming;
          const showMeta = !isStreaming && generationMeta?.messageId === message.id;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={showStreaming}
              streamingContent={showStreaming ? streamingContent : undefined}
              generationMeta={showMeta ? generationMeta : undefined}
            />
          );
        })}
        {isStreaming && <GenerationStatus warmingUp={warmingUp} tokensPerSecond={stats?.tokensPerSecond} />}
        {showOllamaRetry && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <span className="text-[11px] text-destructive">WebGPU failed. Retry using the local Ollama server.</span>
            <button
              type="button"
              onClick={handleRetryWithOllama}
              className={cn(
                "text-[11px] font-semibold",
                "text-destructive hover:text-destructive/80",
                "transition-colors",
              )}
            >
              Retry with Ollama
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <button
        type="button"
        onClick={() => scrollToBottom("smooth")}
        className={cn(
          "absolute bottom-5 right-5",
          "flex items-center gap-2 rounded-full",
          "bg-foreground text-background",
          "text-xs font-medium",
          "shadow-lg",
          "px-3 py-2",
          "transition-all duration-150",
          isAtBottom ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100",
        )}
        aria-label="Scroll to bottom"
      >
        <ArrowDown className="w-3.5 h-3.5" />
        New messages
      </button>
    </div>
  );
}
