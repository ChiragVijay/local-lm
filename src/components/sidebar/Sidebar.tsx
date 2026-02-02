import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Plus, Settings, PanelLeftClose, PanelLeft, Sun, Moon, Loader2, AlertTriangle, Circle } from "lucide-react";
import { cn } from "../../lib/utils";
import { useChats } from "../../hooks/useChats";
import { useTheme } from "../../contexts/theme-context";
import { useInference } from "../../contexts/inference-context";
import { ChatItem } from "./ChatItem";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onToggle, onToggleCollapse }: SidebarProps) {
  const { chats, create, rename, remove, isCreating } = useChats();
  const { mode, toggleMode } = useTheme();
  const { error, connecting } = useInference();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const currentChatId = params.chatId;
  const [isNavigating, setIsNavigating] = useState(false);

  const isExpanded = !isCollapsed;
  const isLoading = isNavigating || isCreating;

  const handleNewChat = async () => {
    if (isLoading) return;

    setIsNavigating(true);

    if (isOpen) {
      onToggle();
    }

    try {
      const chat = await create();
      if (chat?.id) {
        navigate({ to: "/chat/$chatId", params: { chatId: chat.id } });
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const isBackendError = !!error;
  const statusLabel = connecting ? "Connecting" : isBackendError ? "Error" : "Connected";

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onToggle} />}

      <aside
        className={cn(
          "fixed lg:relative z-50 flex h-full flex-col overflow-x-hidden",
          "bg-sidebar",
          "transition-all duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          isExpanded ? "w-[260px]" : "w-[60px]",
        )}
      >
        <div className={cn("flex items-center h-14", isExpanded ? "gap-3 px-4" : "justify-center px-2")}>
          <div className="w-7 h-7 rounded-md bg-foreground/10 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 200 200"
              className="w-4 h-4 text-foreground"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle cx="100" cy="100" r="8" />
              <circle cx="100" cy="50" r="6" />
              <circle cx="100" cy="150" r="6" />
              <circle cx="50" cy="100" r="6" />
              <circle cx="150" cy="100" r="6" />
              <circle cx="65" cy="65" r="6" />
              <circle cx="135" cy="65" r="6" />
              <circle cx="65" cy="135" r="6" />
              <circle cx="135" cy="135" r="6" />
              <line x1="100" y1="100" x2="100" y2="50" strokeLinecap="round" />
              <line x1="100" y1="100" x2="100" y2="150" strokeLinecap="round" />
              <line x1="100" y1="100" x2="50" y2="100" strokeLinecap="round" />
              <line x1="100" y1="100" x2="150" y2="100" strokeLinecap="round" />
              <line x1="100" y1="100" x2="65" y2="65" strokeLinecap="round" />
              <line x1="100" y1="100" x2="135" y2="65" strokeLinecap="round" />
              <line x1="100" y1="100" x2="65" y2="135" strokeLinecap="round" />
              <line x1="100" y1="100" x2="135" y2="135" strokeLinecap="round" />
            </svg>
          </div>
          {isExpanded && (
            <>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="font-display text-sm font-bold text-foreground tracking-tight">LocalLM</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-1",
                    "text-[10px] font-semibold",
                    connecting
                      ? "bg-muted text-muted-foreground"
                      : isBackendError
                        ? "bg-destructive/10 text-destructive"
                        : "bg-emerald-500/10 text-emerald-500",
                  )}
                  title={
                    connecting
                      ? "Connecting to backend"
                      : isBackendError
                        ? (error ?? "Backend error")
                        : "Backend connected"
                  }
                >
                  {connecting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isBackendError ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <Circle className="w-2.5 h-2.5 fill-current" />
                  )}
                  {statusLabel}
                </span>
              </div>
              <button
                onClick={onToggleCollapse}
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                  "text-muted-foreground hover:text-foreground hover:bg-muted",
                  "transition-colors",
                )}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
          {!isExpanded && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "absolute top-14 left-1/2 -translate-x-1/2 w-8 h-8 rounded-md flex items-center justify-center",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                "transition-colors",
              )}
              aria-label="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className={cn("p-3", !isExpanded && "px-2 pt-12")}>
          <button
            type="button"
            onClick={handleNewChat}
            disabled={isLoading}
            className={cn(
              "flex items-center justify-center h-9 rounded-md",
              "bg-foreground text-background",
              "text-sm font-medium",
              "hover:bg-foreground/90 active:scale-[0.98]",
              "transition-all duration-150",
              "touch-manipulation",
              isExpanded ? "w-full gap-2" : "w-full",
              isLoading && "opacity-70 cursor-not-allowed",
            )}
            title={!isExpanded ? "New chat" : undefined}
          >
            {isLoading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Plus className="w-4 h-4 shrink-0" />}
            {isExpanded && (isLoading ? "Creating..." : "New chat")}
          </button>
        </div>

        {isExpanded && (
          <div className="px-4 py-2">
            <span className="font-display text-[11px] font-semibold text-muted-foreground uppercase tracking-widest u-divider">
              Recent
            </span>
          </div>
        )}

        <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin", isExpanded ? "px-2" : "px-1.5")}>
          {chats.length === 0 ? (
            isExpanded && (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            )
          ) : (
            <div className="space-y-0.5">
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  isExpanded={isExpanded}
                  onRename={rename}
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </nav>

        <div
          className={cn("flex flex-col border-t border-sidebar-border overflow-x-hidden", isExpanded ? "p-3" : "p-1.5")}
        >
          <button
            type="button"
            onClick={toggleMode}
            className={cn(
              "flex items-center touch-manipulation",
              "text-sm text-muted-foreground",
              "transition-all duration-150",
              isExpanded
                ? "u-row py-2 hover:text-foreground"
                : "justify-center p-2 rounded-lg hover:bg-muted hover:text-foreground",
            )}
            title={!isExpanded ? (mode === "dark" ? "Light mode" : "Dark mode") : undefined}
          >
            {mode === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {isExpanded && <span className="ml-2.5">{mode === "dark" ? "Light mode" : "Dark mode"}</span>}
          </button>

          <Link
            to="/settings"
            onClick={() => isOpen && onToggle()}
            className={cn(
              "flex items-center touch-manipulation",
              "text-sm text-muted-foreground",
              "transition-all duration-150",
              isExpanded
                ? "u-row py-2 hover:text-foreground"
                : "justify-center p-2 rounded-lg hover:bg-muted hover:text-foreground",
            )}
            title={!isExpanded ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {isExpanded && <span className="ml-2.5">Settings</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
