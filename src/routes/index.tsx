import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Shield, Cpu, Wifi, Loader2 } from "lucide-react";
import { useChats } from "../hooks/useChats";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { chats, create, isCreating } = useChats();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  // Auto-redirect to first chat if available (but only on initial load, not after creating)
  useEffect(() => {
    if (chats.length > 0 && !isCreating && !isNavigating) {
      navigate({ to: "/chat/$chatId", params: { chatId: chats[0].id } });
    }
  }, [chats, navigate, isCreating, isNavigating]);

  const handleNewChat = async () => {
    if (isNavigating || isCreating) return;

    setIsNavigating(true);
    try {
      const chat = await create();
      if (chat?.id) {
        navigate({ to: "/chat/$chatId", params: { chatId: chat.id }, replace: true });
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const isLoading = isNavigating || isCreating;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <Zap className="w-8 h-8 text-accent" />
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight mb-3">LocalLM</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Chat with AI models running on your device. No servers, no tracking — just you and your data.
        </p>

        <button
          type="button"
          onClick={handleNewChat}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 min-w-[160px]",
            "bg-foreground text-background",
            "font-medium",
            "hover:bg-foreground/90 active:scale-[0.98]",
            "transition-all duration-150",
            "touch-manipulation", // Better touch handling
            isLoading && "opacity-70 cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Start chatting"
          )}
        </button>

        <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
          <Feature icon={Shield} label="Private" desc="Data stays local" />
          <Feature icon={Cpu} label="On-device" desc="WebGPU powered" />
          <Feature icon={Wifi} label="Offline" desc="No internet needed" />
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) {
  return (
    <div className="text-center group">
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mx-auto mb-2 group-hover:bg-accent/10 transition-colors">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
      </div>
      <p className="font-display text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
