import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Download } from "lucide-react";
import { MessageList } from "../components/chat";
import { MessageComposer } from "../components/MessageComposer";
import { useMessages } from "../hooks/useMessages";
import { db } from "../lib/db";
import { exportChatAsMarkdown, downloadMarkdown, sanitizeFilename } from "../lib/export";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/chat/$chatId")({
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useParams();
  const { messages, isSending, isStreaming, streamingContent, send, abortGeneration } = useMessages(chatId);

  const chat = useLiveQuery(() => db.chats.get(chatId), [chatId]);
  const hasMessages = messages.length > 0;

  const handleExport = () => {
    if (!chat || !hasMessages) return;
    const markdown = exportChatAsMarkdown(chat, messages);
    const filename = `${sanitizeFilename(chat.title)}-${Date.now()}.md`;
    downloadMarkdown(filename, markdown);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {hasMessages && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-border">
          <button
            onClick={handleExport}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors",
            )}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      )}
      <MessageList messages={messages} isStreaming={isStreaming} streamingContent={streamingContent} />
      <MessageComposer onSend={send} onAbort={abortGeneration} isSending={isSending} isStreaming={isStreaming} />
    </div>
  );
}
