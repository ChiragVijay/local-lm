import { Copy, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";

interface CodeBlockProps {
  language?: string;
  code: string;
  isUser: boolean;
}

export function CodeBlock({ language, code, isUser }: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div
      className={cn(
        "rounded-md overflow-hidden my-2 border",
        isUser ? "bg-background/10 border-background/20" : "bg-muted border-border",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1.5 border-b",
          isUser ? "text-background/70 border-background/10" : "text-muted-foreground border-border",
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest">{language || "code"}</span>
        <button
          onClick={() => copy(code)}
          className={cn(
            "flex items-center gap-1 text-[10px] transition-colors",
            isUser ? "hover:text-background" : "hover:text-accent",
          )}
        >
          {copied ? (
            <>
              <Check className={cn("w-3 h-3", !isUser && "text-accent")} />
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
      <pre className="p-3 overflow-x-auto font-mono text-[13px]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
