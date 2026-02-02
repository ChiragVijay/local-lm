import Markdown from "react-markdown";
import { cn } from "../../lib/utils";
import { CodeBlock } from "./CodeBlock";

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  return (
    <div className="markdown-content text-sm leading-relaxed">
      <Markdown
        components={{
          p({ children }) {
            return <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="font-display text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="font-display text-base font-semibold mt-3 mb-1.5 first:mt-0">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="font-display text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1">{children}</li>;
          },
          strong({ children }) {
            return <strong className="font-semibold">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote
                className={cn("border-l-2 pl-3 my-2 italic", isUser ? "border-primary-foreground/30" : "border-border")}
              >
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className={cn("my-3", isUser ? "border-primary-foreground/20" : "border-border")} />;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = match || (typeof children === "string" && children.includes("\n"));

            if (isBlock) {
              return <CodeBlock language={match?.[1]} code={String(children).replace(/\n$/, "")} isUser={isUser} />;
            }

            return (
              <code
                className={cn(
                  "px-1 py-0.5 rounded text-[13px] font-display",
                  isUser ? "bg-primary-foreground/20" : "bg-muted",
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
