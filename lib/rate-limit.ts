type Entry = { count: number; resetAt: number };

// globalThis で開発時のホットリロードをまたいで状態を保持
const g = globalThis as unknown as { _rlStore?: Map<string, Entry> };
if (!g._rlStore) g._rlStore = new Map();
const store = g._rlStore;

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  // 古いエントリが溜まりすぎたら掃除
  if (store.size > 10000) {
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
