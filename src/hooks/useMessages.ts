import { useLiveQuery } from "dexie-react-hooks";
import { useState, useRef } from "react";
import { getMessages, addMessage, db, type Message } from "../lib/db";
import { useInference } from "../contexts/inference-context";
import { recordGeneration, recordMessage } from "../lib/stats";

export function useMessages(chatId: string | undefined) {
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const streamingMessageId = useRef<string | null>(null);

  const inference = useInference();

  const messages = useLiveQuery(() => (chatId ? getMessages(chatId) : Promise.resolve([])), [chatId], []);

  const send = async (content: string): Promise<Message | undefined> => {
    if (!chatId || !content.trim()) return;

    setIsSending(true);
    setGenerationError(null);

    try {
      const trimmedContent = content.trim();
      const userMessage = await addMessage(chatId, "user", trimmedContent);
      recordMessage();

      if (!inference.modelLoaded) {
        await addMessage(
          chatId,
          "assistant",
          "No model loaded. Please select and download a model first, then load it to start chatting.",
        );
        return userMessage;
      }

      setIsStreaming(true);
      setStreamingContent("");

      const allMessages = await getMessages(chatId);
      const prompt = buildPrompt(allMessages);

      const assistantMessage = await addMessage(chatId, "assistant", "");
      streamingMessageId.current = assistantMessage.id;

      let fullContent = "";
      let tokensGenerated = 0;
      const generationStart = Date.now();

      try {
        await inference.generate(prompt, (chunk) => {
          fullContent += chunk;
          tokensGenerated++;
          setStreamingContent(fullContent);
          db.messages.update(assistantMessage.id, { content: fullContent });
        });
      } catch (e) {
        const errorMessage = (e as Error).message;
        setGenerationError(errorMessage);
        if (!fullContent) {
          await db.messages.update(assistantMessage.id, {
            content: `Error: ${errorMessage}`,
          });
        }
      }

      if (tokensGenerated > 0 && inference.loadedModelId) {
        recordGeneration(inference.loadedModelId, tokensGenerated, Date.now() - generationStart);
      }

      setIsStreaming(false);
      setStreamingContent("");
      streamingMessageId.current = null;

      return userMessage;
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  const abortGeneration = async () => {
    await inference.abort();
    setIsStreaming(false);
  };

  return {
    messages,
    isSending,
    isStreaming,
    streamingContent,
    generationError,
    send,
    abortGeneration,
  };
}

function buildPrompt(messages: Message[]): string {
  const formatted = messages.map((m) => {
    if (m.role === "user") {
      return `<start_of_turn>user\n${m.content}<end_of_turn>`;
    } else if (m.role === "assistant" && m.content) {
      return `<start_of_turn>model\n${m.content}<end_of_turn>`;
    }
    return "";
  });

  return formatted.filter(Boolean).join("\n") + "\n<start_of_turn>model\n";
}
