'use client';

import { createAppQueryClient, registerAppQueryClient } from '@/lib/query/appQueryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createAppQueryClient());

  useEffect(() => {
    registerAppQueryClient(client);
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
