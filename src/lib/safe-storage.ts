// Every accessor in src/lib persists through the browser's localStorage. Reading
// or writing it can THROW rather than return null — Safari/Firefox private mode,
// "block all site data", and cross-origin preview iframes with partitioned
// storage all raise a SecurityError on first access.
//
// Those accessors are called from `useEffect` (see useAuth), and React forwards
// an effect-time throw to the nearest error boundary, so a single unavailable
// localStorage replaced the whole app with the root error screen on every route.
//
// safeStorage keeps that failure local: reads fall back to an in-memory Map and
// writes are dropped. State stops surviving a reload, which is the honest
// outcome when the browser refuses to persist anything, but the app still runs.

const memory = new Map<string, string>();

function backingStore(): Storage | null {
  try {
    if (typeof globalThis.localStorage === "undefined") return null;
    // Touching a partitioned/blocked store throws here rather than on the first
    // get, so probe once and fall through to the in-memory Map when it does.
    globalThis.localStorage.getItem("__cof_probe__");
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    const store = backingStore();
    if (!store) return memory.get(key) ?? null;
    try {
      return store.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },

  setItem(key: string, value: string): void {
    memory.set(key, value);
    const store = backingStore();
    if (!store) return;
    try {
      store.setItem(key, value);
    } catch {
      // Quota exceeded or storage blocked — the in-memory copy above still holds.
    }
  },

  removeItem(key: string): void {
    memory.delete(key);
    const store = backingStore();
    if (!store) return;
    try {
      store.removeItem(key);
    } catch {
      // Nothing to undo; the in-memory copy is already gone.
    }
  },
};
