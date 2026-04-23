export interface MatchResult {
  matchScore: number | null;
  matchingSkills: string[];
}

const MAX_RESULTS = 200;
const resultCache = new Map<string, MatchResult>();
const inFlightCache = new Map<string, Promise<MatchResult>>();

const buildKey = (userId: string, jobId: string) => `${userId}:${jobId}`;

export function getCachedMatch(userId: string, jobId: string): MatchResult | undefined {
  const key = buildKey(userId, jobId);
  const value = resultCache.get(key);
  if (value !== undefined) {
    resultCache.delete(key);
    resultCache.set(key, value);
  }
  return value;
}

export function setCachedMatch(userId: string, jobId: string, result: MatchResult): void {
  const key = buildKey(userId, jobId);
  if (resultCache.has(key)) resultCache.delete(key);
  resultCache.set(key, result);
  while (resultCache.size > MAX_RESULTS) {
    const oldest = resultCache.keys().next().value;
    if (oldest === undefined) break;
    resultCache.delete(oldest);
  }
}

export function getInFlightMatch(userId: string, jobId: string): Promise<MatchResult> | undefined {
  return inFlightCache.get(buildKey(userId, jobId));
}

export function registerInFlightMatch(
  userId: string,
  jobId: string,
  promise: Promise<MatchResult>
): void {
  const key = buildKey(userId, jobId);
  inFlightCache.set(key, promise);
  promise.finally(() => {
    if (inFlightCache.get(key) === promise) inFlightCache.delete(key);
  });
}

export function clearMatchCache(): void {
  resultCache.clear();
  inFlightCache.clear();
}
