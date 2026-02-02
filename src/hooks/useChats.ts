import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { getAllChats, createChat, updateChat, deleteChat, type Chat } from "../lib/db";
import { recordNewChat } from "../lib/stats";

export function useChats() {
  const [isCreating, setIsCreating] = useState(false);

  const chats = useLiveQuery(() => getAllChats(), [], []);

  const create = async (title?: string): Promise<Chat> => {
    setIsCreating(true);
    try {
      const chat = await createChat(title);
      recordNewChat();
      return chat;
    } finally {
      setIsCreating(false);
    }
  };

  const rename = async (id: string, title: string) => {
    await updateChat(id, { title });
  };

  const remove = async (id: string) => {
    await deleteChat(id);
  };

  return {
    chats,
    isCreating,
    create,
    rename,
    remove,
  };
}
