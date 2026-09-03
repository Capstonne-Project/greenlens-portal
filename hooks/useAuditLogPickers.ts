'use client';

import { fetchAdminReports, fetchAdminReportDetail } from '@/lib/api/services/fetchAdminReports';
import { fetchAdminUsers, fetchAdminUserDetail } from '@/lib/api/services/fetchAdmin';
import { fetchAdminPollutionCategories } from '@/lib/api/services/fetchPollutionCategory';
import { fetchCompanies, fetchCompanyDetail } from '@/lib/api/services/fetchCompany';
import { fetchAdminWasteTags } from '@/lib/api/services/fetchWasteTag';
import { fetchNotificationTemplates } from '@/lib/api/services/fetchNotificationTemplate';
import { useDebouncedValue, SEARCH_DEBOUNCE_MS } from '@/hooks/useDebouncedValue';
import { useProtectedQueryEnabled } from '@/hooks/useAuthSession';
import { useQuery } from '@tanstack/react-query';

export const auditLogPickerKeys = {
  users: (search: string, role?: string) =>
    ['audit-log-picker', 'users', search, role ?? ''] as const,
  reports: (search: string) => ['audit-log-picker', 'reports', search] as const,
  companies: (search: string) => ['audit-log-picker', 'companies', search] as const,
  pollutionCategories: (search: string) =>
    ['audit-log-picker', 'pollution-categories', search] as const,
  wasteTags: () => ['audit-log-picker', 'waste-tags'] as const,
  notificationTemplates: () => ['audit-log-picker', 'notification-templates'] as const,
  userLabel: (id: string) => ['audit-log-picker', 'user-label', id] as const,
  reportLabel: (id: string) => ['audit-log-picker', 'report-label', id] as const,
  companyLabel: (id: string) => ['audit-log-picker', 'company-label', id] as const,
};

const PICKER_STALE_MS = 60 * 1000;

/** Tìm người dùng cho filter actor / entity User. */
export function useAuditUserSearch(
  search: string,
  roleFilter: string | undefined,
  enabled: boolean
) {
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const canFetch = useProtectedQueryEnabled(enabled);
  return useQuery({
    queryKey: auditLogPickerKeys.users(debounced, roleFilter),
    queryFn: () =>
      fetchAdminUsers({
        page: 1,
        pageSize: 20,
        ...(debounced.trim() ? { search: debounced.trim() } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      }),
    select: envelope => envelope.data.items,
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

export function useAuditUserLabel(userId: string | null) {
  const canFetch = useProtectedQueryEnabled(Boolean(userId));
  return useQuery({
    queryKey: auditLogPickerKeys.userLabel(userId ?? ''),
    queryFn: () => fetchAdminUserDetail(userId!),
    select: envelope => {
      const u = envelope.data;
      return { id: u.id, label: u.fullName || u.email, sublabel: u.email };
    },
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

/** Tìm báo cáo theo mã / địa chỉ. */
export function useAuditReportSearch(search: string, enabled: boolean) {
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const canFetch = useProtectedQueryEnabled(enabled);
  return useQuery({
    queryKey: auditLogPickerKeys.reports(debounced),
    queryFn: () =>
      fetchAdminReports({
        page: 1,
        pageSize: 20,
        ...(debounced.trim() ? { search: debounced.trim() } : {}),
      }),
    select: envelope => envelope.data.items,
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

export function useAuditReportLabel(reportId: string | null) {
  const canFetch = useProtectedQueryEnabled(Boolean(reportId));
  return useQuery({
    queryKey: auditLogPickerKeys.reportLabel(reportId ?? ''),
    queryFn: () => fetchAdminReportDetail(reportId!),
    select: envelope => {
      const r = envelope.data;
      return { id: r.id, label: r.code, sublabel: r.address };
    },
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

/** Tìm công ty DVMT. */
export function useAuditCompanySearch(search: string, enabled: boolean) {
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const canFetch = useProtectedQueryEnabled(enabled);
  return useQuery({
    queryKey: auditLogPickerKeys.companies(debounced),
    queryFn: () =>
      fetchCompanies({
        page: 1,
        pageSize: 20,
        ...(debounced.trim() ? { search: debounced.trim() } : {}),
      }),
    select: envelope => envelope.data.items,
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

export function useAuditCompanyLabel(companyId: string | null) {
  const canFetch = useProtectedQueryEnabled(Boolean(companyId));
  return useQuery({
    queryKey: auditLogPickerKeys.companyLabel(companyId ?? ''),
    queryFn: () => fetchCompanyDetail(companyId!),
    select: envelope => {
      const c = envelope.data;
      return { id: c.id, label: c.name, sublabel: c.contractNumber };
    },
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

export function useAuditPollutionCategorySearch(search: string, enabled: boolean) {
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const canFetch = useProtectedQueryEnabled(enabled);
  return useQuery({
    queryKey: auditLogPickerKeys.pollutionCategories(debounced),
    queryFn: () =>
      fetchAdminPollutionCategories({
        page: 1,
        pageSize: 30,
        ...(debounced.trim() ? { search: debounced.trim() } : {}),
      }),
    select: envelope => envelope.data.items,
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

export function useAuditWasteTagSearch(search: string, enabled: boolean) {
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const canFetch = useProtectedQueryEnabled(enabled);
  return useQuery({
    queryKey: auditLogPickerKeys.wasteTags(),
    queryFn: () => fetchAdminWasteTags(),
    select: envelope => {
      const q = debounced.trim().toLowerCase();
      const items = envelope.data.items;
      if (!q) return items.slice(0, 30);
      return items
        .filter(
          t =>
            t.code.toLowerCase().includes(q) ||
            t.nameVi.toLowerCase().includes(q) ||
            t.nameEn.toLowerCase().includes(q)
        )
        .slice(0, 30);
    },
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}

export function useAuditNotificationTemplateSearch(search: string, enabled: boolean) {
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const canFetch = useProtectedQueryEnabled(enabled);
  return useQuery({
    queryKey: auditLogPickerKeys.notificationTemplates(),
    queryFn: () => fetchNotificationTemplates({ page: 1, pageSize: 50 }),
    select: envelope => {
      const q = debounced.trim().toLowerCase();
      const items = envelope.data.items;
      if (!q) return items.slice(0, 30);
      return items
        .filter(t => t.templateKey.toLowerCase().includes(q) || t.titleVi.toLowerCase().includes(q))
        .slice(0, 30);
    },
    enabled: canFetch,
    staleTime: PICKER_STALE_MS,
  });
}
