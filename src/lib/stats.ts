const STATS_KEY = "local-lm-stats";

export interface AllTimeStats {
  totalMessages: number;
  totalOutputTokensGenerated: number;
  totalGenerationTimeMs: number;
  totalChats: number;
  sessionsCount: number;
  firstUsed: number;
  lastUsed: number;
  modelUsage: Record<string, { tokens: number; generations: number }>;
}

function getDefaultStats(): AllTimeStats {
  return {
    totalMessages: 0,
    totalOutputTokensGenerated: 0,
    totalGenerationTimeMs: 0,
    totalChats: 0,
    sessionsCount: 0,
    firstUsed: Date.now(),
    lastUsed: Date.now(),
    modelUsage: {},
  };
}

export function getStats(): AllTimeStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored) as AllTimeStats;
    }
  } catch {
    // ignoxre
  }
  return getDefaultStats();
}

export function saveStats(stats: AllTimeStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function recordGeneration(modelId: string, tokensGenerated: number, generationTimeMs: number): void {
  const stats = getStats();

  stats.totalOutputTokensGenerated += tokensGenerated;
  stats.totalGenerationTimeMs += generationTimeMs;
  stats.lastUsed = Date.now();

  if (!stats.modelUsage[modelId]) {
    stats.modelUsage[modelId] = { tokens: 0, generations: 0 };
  }
  stats.modelUsage[modelId].tokens += tokensGenerated;
  stats.modelUsage[modelId].generations += 1;

  saveStats(stats);
}

export function recordMessage(): void {
  const stats = getStats();
  stats.totalMessages += 1;
  stats.lastUsed = Date.now();
  saveStats(stats);
}

export function recordNewChat(): void {
  const stats = getStats();
  stats.totalChats += 1;
  stats.lastUsed = Date.now();
  saveStats(stats);
}

export function recordSession(): void {
  const stats = getStats();
  stats.sessionsCount += 1;
  stats.lastUsed = Date.now();
  saveStats(stats);
}

export function resetStats(): void {
  saveStats(getDefaultStats());
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString();
}
