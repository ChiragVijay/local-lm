interface GenerationStatusProps {
  warmingUp: boolean;
  tokensPerSecond?: number;
}

export function GenerationStatus({ warmingUp, tokensPerSecond }: GenerationStatusProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {warmingUp ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          <span>Warming up model...</span>
        </>
      ) : tokensPerSecond !== undefined ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-accent status-pulse" />
          <span className="font-mono">{tokensPerSecond.toFixed(1)} tokens/sec</span>
        </>
      ) : null}
    </div>
  );
}
