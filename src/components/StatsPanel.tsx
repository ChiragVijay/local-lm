import { useState } from "react";
import { X, Zap, MessageSquare, Clock, TrendingUp, RotateCcw } from "lucide-react";
import { cn } from "../lib/utils";
import { getStats, resetStats, formatDuration, formatNumber } from "../lib/stats";

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const currentStats = getStats();

  const avgTokensPerSecond =
    currentStats.totalGenerationTimeMs > 0
      ? (currentStats.totalOutputTokensGenerated / (currentStats.totalGenerationTimeMs / 1000)).toFixed(1)
      : "0";

  const topModels = Object.entries(currentStats.modelUsage)
    .sort(([, a], [, b]) => b.tokens - a.tokens)
    .slice(0, 3);

  const now = currentStats.lastUsed;
  const daysSinceFirstUse = Math.max(1, Math.floor((now - currentStats.firstUsed) / (1000 * 60 * 60 * 24)));

  const handleReset = () => {
    resetStats();
    setShowResetConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-sm",
          "bg-popover border border-border rounded-lg shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-100",
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-display text-sm font-semibold text-foreground">Usage Statistics</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Zap className="w-3.5 h-3.5 text-accent" />}
              label="Output Tokens"
              value={formatNumber(currentStats.totalOutputTokensGenerated)}
            />
            <StatCard
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              label="Messages"
              value={formatNumber(currentStats.totalMessages)}
            />
            <StatCard
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Gen. Time"
              value={formatDuration(currentStats.totalGenerationTimeMs)}
            />
            <StatCard
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              label="Avg Speed"
              value={`${avgTokensPerSecond} t/s`}
            />
          </div>

          {topModels.length > 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <span className="font-display text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Top Models
              </span>
              <div className="mt-2 space-y-2">
                {topModels.map(([modelId, usage], index) => {
                  const percentage =
                    currentStats.totalOutputTokensGenerated > 0
                      ? (usage.tokens / currentStats.totalOutputTokensGenerated) * 100
                      : 0;
                  return (
                    <div key={modelId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground truncate max-w-[160px]">
                          {modelId.split("-").slice(0, 2).join(" ")}
                        </span>
                        <span className="font-mono text-muted-foreground">{formatNumber(usage.tokens)}</span>
                      </div>
                      <div className="h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full bg-accent transition-all",
                            index === 1 && "opacity-60",
                            index === 2 && "opacity-30",
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              {daysSinceFirstUse} day{daysSinceFirstUse > 1 ? "s" : ""} of usage
            </span>
            <span>{currentStats.totalChats} chats</span>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border">
          {showResetConfirm ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Reset all stats?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 text-xs rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs rounded-md bg-destructive text-white hover:bg-destructive/90 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset statistics
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-widest font-semibold">{label}</span>
      </div>
      <p className="font-display text-lg font-bold text-foreground tracking-tight">{value}</p>
    </div>
  );
}
