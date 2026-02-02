import { db, createChat, addMessage } from "./db";

/**
 * Seeds the database with example conversations on first run.
 * Only runs if no chats exist yet.
 */
export async function seedDatabase(): Promise<void> {
  const chatCount = await db.chats.count();
  if (chatCount > 0) return;

  const welcomeChat = await createChat("Welcome");
  await addMessage(
    welcomeChat.id,
    "assistant",
    `**Welcome to LocalLM** - chat with AI models running on your device.

- **Private by design** - Your conversations never leave your device
- **WebGPU accelerated** - Fast inference using your GPU

**To get started:**
1. Click the model selector below
2. Download a model from HuggingFace
3. Import the model file
4. Start chatting!`,
  );
}
