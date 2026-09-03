/**
 * Hard-reload session gate — prevents protected axios calls from leaving the
 * browser without a Bearer JWT (401 → refresh → 200 flash).
 *
 * AuthProvider marks pending on mount, then complete after silent refresh /
 * hydrate. L1 request interceptor awaits this before attaching Authorization.
 *
 * Enterprise notes:
 * - Single-flight waiters share one Promise (no thundering herd).
 * - Hard timeout unblocks the app if AuthProvider never finishes.
 * - `ready` stays true after first bootstrap for the tab lifetime (login sets
 *   memory JWT immediately; logout clears token but does not re-arm the gate).
 */

type Listener = () => void;

let ready = false;
let waitPromise: Promise<void> | null = null;
let resolveWait: (() => void) | null = null;
const listeners = new Set<Listener>();

/** Default bootstrap budget — under this, UX waits; above, fail open. */
export const SESSION_RESTORE_TIMEOUT_MS = 8_000;

function notify(): void {
  listeners.forEach(listener => listener());
}

function readMemoryToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { __authToken?: string }).__authToken;
}

/** Start waiting — idempotent. Skips wait if memory JWT already present. */
export function markSessionRestorePending(): void {
  if (typeof window === 'undefined') return;
  if (ready) return;
  if (readMemoryToken()) {
    markSessionRestoreComplete();
    return;
  }
  if (!waitPromise) {
    waitPromise = new Promise<void>(resolve => {
      resolveWait = resolve;
    });
  }
}

/** Unblock queued L1 requests — call from AuthProvider `finally`. */
export function markSessionRestoreComplete(): void {
  if (ready) return;
  ready = true;
  const resolve = resolveWait;
  resolveWait = null;
  waitPromise = null;
  resolve?.();
  notify();
}

export function isSessionRestoreComplete(): boolean {
  return ready;
}

/**
 * Await bootstrap (hydrate + optional silent refresh).
 * Hard timeout so a hung AuthProvider cannot stall the app.
 */
export async function waitForSessionRestore(
  timeoutMs = SESSION_RESTORE_TIMEOUT_MS
): Promise<void> {
  if (typeof window === 'undefined' || ready) return;
  if (readMemoryToken()) {
    markSessionRestoreComplete();
    return;
  }

  markSessionRestorePending();
  if (!waitPromise) return;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      waitPromise,
      new Promise<void>(resolve => {
        timeoutId = setTimeout(() => {
          markSessionRestoreComplete();
          resolve();
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function subscribeSessionRestore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** SSR / first paint — do not block server render. */
export function getSessionRestoreServerSnapshot(): boolean {
  return true;
}
