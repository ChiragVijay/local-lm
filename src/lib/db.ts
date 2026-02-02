import Dexie, { type EntityTable } from "dexie";

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export interface Model {
  id: string;
  name: string;
  engine: "webllm" | "transformers" | "onnx" | "mediapipe";
  size: number;
  quantization: string;
  downloaded: boolean;
  downloadProgress: number;
}

export interface ModelBlob {
  id: string;
  blob: Blob;
}

export interface Settings {
  id: string;
  key: string;
  value: string | number | boolean;
}

const db = new Dexie("LocalLMDatabase") as Dexie & {
  chats: EntityTable<Chat, "id">;
  messages: EntityTable<Message, "id">;
  models: EntityTable<Model, "id">;
  modelBlobs: EntityTable<ModelBlob, "id">;
  settings: EntityTable<Settings, "id">;
};

db.version(1).stores({
  chats: "id, title, createdAt, updatedAt",
  messages: "id, chatId, role, createdAt",
  models: "id, name, engine, downloaded",
  settings: "id, key",
});

db.version(2).stores({
  chats: "id, title, createdAt, updatedAt",
  messages: "id, chatId, role, createdAt",
  models: "id, name, engine, downloaded",
  modelBlobs: "id",
  settings: "id, key",
});

export { db };

export function generateId(): string {
  return crypto.randomUUID();
}

export async function createChat(title: string = "New Chat"): Promise<Chat> {
  const now = new Date();
  const chat: Chat = {
    id: generateId(),
    title,
    createdAt: now,
    updatedAt: now,
  };
  await db.chats.add(chat);
  return chat;
}

export async function updateChat(id: string, updates: Partial<Pick<Chat, "title">>): Promise<void> {
  await db.chats.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteChat(id: string): Promise<void> {
  await db.transaction("rw", [db.chats, db.messages], async () => {
    await db.messages.where("chatId").equals(id).delete();
    await db.chats.delete(id);
  });
}

export async function getAllChats(): Promise<Chat[]> {
  return db.chats.orderBy("updatedAt").reverse().toArray();
}

export async function getChat(id: string): Promise<Chat | undefined> {
  return db.chats.get(id);
}

export async function addMessage(chatId: string, role: Message["role"], content: string): Promise<Message> {
  const message: Message = {
    id: generateId(),
    chatId,
    role,
    content,
    createdAt: new Date(),
  };
  await db.messages.add(message);
  await db.chats.update(chatId, { updatedAt: new Date() });
  return message;
}

export async function getMessages(chatId: string): Promise<Message[]> {
  return db.messages.where("chatId").equals(chatId).sortBy("createdAt");
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const setting = await db.settings.where("key").equals(key).first();
  return setting ? (setting.value as T) : defaultValue;
}

export async function setSetting(key: string, value: string | number | boolean): Promise<void> {
  const existing = await db.settings.where("key").equals(key).first();
  if (existing) {
    await db.settings.update(existing.id, { value });
  } else {
    await db.settings.add({ id: generateId(), key, value });
  }
}
