import { Copy, Check, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { MessageContent } from "./MessageContent";
import { StreamingCursor } from "./StreamingCursor";
import type { Message } from "../../lib/db";

export interface GenerationMeta {
  messageId: string;
  tokensPerSecond: number;
  tokenCount: number;
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  generationMeta?: GenerationMeta | null;
}

export function MessageBubble({ message, isStreaming, streamingContent, generationMeta }: MessageBubbleProps) {
  const { copied, copy } = useCopyToClipboard();
  const isUser = message.role === "user";
  const displayContent = isStreaming ? streamingContent || message.content : message.content;

  return (
    <div className={cn("flex w-full group", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("space-y-1", isUser ? "max-w-[80%]" : "w-full")}>
        <div className={cn("rounded-lg px-4 py-3", isUser ? "bg-foreground text-background" : "bg-transparent")}>
          <MessageContent content={displayContent} isUser={isUser} />
          {isStreaming && <StreamingCursor />}
        </div>

        <div
          className={cn(
            "flex items-center gap-3 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {generationMeta && !isUser && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Zap className="w-3 h-3 text-accent" />
              {generationMeta.tokensPerSecond.toFixed(1)} tok/s
              <span className="text-border">·</span>
              {generationMeta.tokenCount} tokens
            </span>
          )}
          <button
            onClick={() => copy(displayContent)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[11px]",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors",
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-accent" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
