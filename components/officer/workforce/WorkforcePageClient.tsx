'use client';

import { LeoWorkforcePageClient } from './LeoWorkforcePageClient';

/** ACL LEO do proxy — không render Access Denied trên client. */
export function WorkforcePageClient() {
  return <LeoWorkforcePageClient />;
}
