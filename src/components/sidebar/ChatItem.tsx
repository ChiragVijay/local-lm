import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { cn, formatRelativeTime } from "../../lib/utils";
import type { Chat } from "../../lib/db";

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  isExpanded: boolean;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ChatItem({ chat, isActive, isExpanded, onRename, onDelete }: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() && editValue !== chat.title) {
      await onRename(chat.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(chat.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (isEditing && isExpanded) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-sidebar-accent px-2 py-1.5">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 bg-transparent text-sm text-foreground outline-none"
        />
        <button onClick={handleSave} className="p-1 rounded hover:bg-border text-primary">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleCancel} className="p-1 rounded hover:bg-border text-muted-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/chat/$chatId"
      params={{ chatId: chat.id }}
      className={cn(
        "group flex items-center",
        "transition-all duration-150",
        isExpanded
          ? ["u-row py-2", isActive ? "u-row--active text-foreground" : "text-muted-foreground hover:text-foreground"]
          : [
              "justify-center p-2 rounded-lg",
              isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            ],
      )}
      title={!isExpanded ? chat.title : undefined}
    >
      <MessageSquare className={cn("w-4 h-4 shrink-0", isActive && "text-accent")} />
      {isExpanded && (
        <>
          <div className="flex-1 min-w-0 ml-2.5">
            <p className="text-sm truncate">{chat.title}</p>
            <p className="text-[11px] text-muted-foreground">{formatRelativeTime(chat.updatedAt)}</p>
          </div>
          <div className="hidden group-hover:flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(chat.id);
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </Link>
  );
}
