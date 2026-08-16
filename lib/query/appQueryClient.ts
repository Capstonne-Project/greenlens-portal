import { QueryClient } from '@tanstack/react-query';
import { isAbortError } from '@/lib/utils/abortError';

/**
 * Browser QueryClient singleton — MUST be the same instance as QueryClientProvider.
 * Strict Mode double-invokes useState initializers; always creating a new client
 * leaves Provider on client A while module refs point at orphaned client B.
 *
 * Session teardown must prefer `useQueryClient()` (live Provider instance).
 * Module singleton is only for Strict-Mode reuse + optional register from Provider.
 */
let browserQueryClient: QueryClient | null = null;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 3 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        retry: (failureCount, error) => {
          if (isAbortError(error)) return false;
          return failureCount < 1;
        },
      },
      mutations: { retry: false },
    },
  });
}

/** Prefer this in QueryProvider — reuse singleton across Strict Mode double-init. */
export function createAppQueryClient(): QueryClient {
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/** Keep module ref aligned with the Provider instance (survives HMR drift). */
export function registerAppQueryClient(client: QueryClient): void {
  browserQueryClient = client;
}

export function getAppQueryClient(): QueryClient | null {
  return browserQueryClient;
}

/** Cancel in-flight + clear — pass the live Provider client from useQueryClient(). */
export async function resetQueryClientCache(client: QueryClient): Promise<void> {
  await client.cancelQueries();
  client.clear();
}
