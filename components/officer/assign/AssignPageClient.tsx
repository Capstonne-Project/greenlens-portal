'use client';

import { LeoAssignPageClient } from './LeoAssignPageClient';

/** ACL LEO do proxy — không render Access Denied trên client. */
export function AssignPageClient() {
  return <LeoAssignPageClient />;
}
