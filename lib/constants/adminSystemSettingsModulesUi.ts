import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  ClipboardCheck,
  Globe2,
  HandHeart,
  MapPin,
  MessageSquare,
  Recycle,
  ScrollText,
  Settings2,
  Shield,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react';

/** Lucide icon theo slug/module BE — fallback Settings2. */
const MODULE_ICON_BY_KEY: Record<string, LucideIcon> = {
  reports: Shield,
  report: Shield,
  sla: Timer,
  geography: MapPin,
  geo: MapPin,
  'public-map': Globe2,
  publicmap: Globe2,
  map: Globe2,
  officers: ShieldCheck,
  officer: ShieldCheck,
  cleanup: Recycle,
  clean: Recycle,
  notifications: Bell,
  notification: Bell,
  auth: ShieldCheck,
  authentication: ShieldCheck,
  comments: MessageSquare,
  comment: MessageSquare,
  organization: Building2,
  org: Building2,
  community: HandHeart,
  'community-cleanup': HandHeart,
  storage: ScrollText,
  retention: ScrollText,
  inspection: ClipboardCheck,
  workforce: Users,
  gamification: Users,
};

function normalizeModuleKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
}

export function getSystemSettingsModuleIcon(module: string, routeSlug?: string): LucideIcon {
  const candidates = [routeSlug, module].filter(Boolean).map(v => normalizeModuleKey(v!));
  for (const key of candidates) {
    const icon = MODULE_ICON_BY_KEY[key];
    if (icon) return icon;
  }
  for (const key of candidates) {
    const partial = Object.entries(MODULE_ICON_BY_KEY).find(
      ([k]) => key.includes(k) || k.includes(key)
    );
    if (partial) return partial[1];
  }
  return Settings2;
}
