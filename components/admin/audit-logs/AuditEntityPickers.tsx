'use client';

import {
  AuditGuidInput,
  AuditSearchPicker,
  type AuditSearchOption,
} from '@/components/admin/audit-logs/AuditSearchPicker';
import {
  useAuditCompanyLabel,
  useAuditCompanySearch,
  useAuditNotificationTemplateSearch,
  useAuditPollutionCategorySearch,
  useAuditReportLabel,
  useAuditReportSearch,
  useAuditUserLabel,
  useAuditUserSearch,
  useAuditWasteTagSearch,
} from '@/hooks/useAuditLogPickers';
import { roleDisplayVi } from '@/utils/adminUserUi';
import { useMemo, useState } from 'react';

interface AuditActorPickerProps {
  userId: string;
  actorRole: string;
  onChange: (userId: string | null) => void;
  onPageReset?: () => void;
}

export function AuditActorPicker({
  userId,
  actorRole,
  onChange,
  onPageReset,
}: AuditActorPickerProps) {
  const [search, setSearch] = useState('');
  const listQuery = useAuditUserSearch(search, actorRole || undefined, true);
  const labelQuery = useAuditUserLabel(userId || null);

  const options = useMemo<AuditSearchOption[]>(
    () =>
      (listQuery.data ?? []).map(u => ({
        id: u.id,
        label: u.fullName || u.email,
        sublabel: u.email,
        badge: roleDisplayVi(u.role),
      })),
    [listQuery.data]
  );

  return (
    <AuditSearchPicker
      inputId="audit-actor-picker"
      label="Người thực hiện"
      hint={
        actorRole
          ? `Lọc role ${roleDisplayVi(actorRole)}. Gõ email hoặc họ tên — không cần UUID.`
          : 'Gõ email hoặc họ tên để chọn người thực hiện.'
      }
      placeholder="Tìm admin, officer…"
      value={userId}
      onChange={onChange}
      options={options}
      isLoading={listQuery.isFetching}
      resolved={labelQuery.data ?? null}
      emptyMessage="Không tìm thấy người dùng phù hợp."
      onPageReset={onPageReset}
      onSearchChange={setSearch}
    />
  );
}

interface AuditEntityIdPickerProps {
  entityType: string;
  entityId: string;
  onChange: (entityId: string | null) => void;
  onPageReset?: () => void;
}

export function AuditEntityIdPicker({
  entityType,
  entityId,
  onChange,
  onPageReset,
}: AuditEntityIdPickerProps) {
  if (!entityType) {
    return (
      <AuditSearchPicker
        inputId="audit-entity-id-picker"
        label="Entity đích"
        placeholder="Chọn loại đối tượng trước"
        value=""
        onChange={() => undefined}
        options={[]}
        disabled
        hint="Chọn Entity type trước (User, Report, Company…)."
      />
    );
  }

  switch (entityType) {
    case 'User':
      return (
        <AuditEntityUserPicker entityId={entityId} onChange={onChange} onPageReset={onPageReset} />
      );
    case 'Report':
      return (
        <AuditEntityReportPicker
          entityId={entityId}
          onChange={onChange}
          onPageReset={onPageReset}
        />
      );
    case 'Company':
      return (
        <AuditEntityCompanyPicker
          entityId={entityId}
          onChange={onChange}
          onPageReset={onPageReset}
        />
      );
    case 'PollutionCategory':
      return (
        <AuditEntityPollutionCategoryPicker
          entityId={entityId}
          onChange={onChange}
          onPageReset={onPageReset}
        />
      );
    case 'WasteTag':
      return (
        <AuditEntityWasteTagPicker
          entityId={entityId}
          onChange={onChange}
          onPageReset={onPageReset}
        />
      );
    case 'NotificationTemplate':
      return (
        <AuditEntityNotificationTemplatePicker
          entityId={entityId}
          onChange={onChange}
          onPageReset={onPageReset}
        />
      );
    default:
      return (
        <AuditGuidInput
          inputId="audit-entity-id-guid"
          label="Entity đích"
          hint={`Loại ${entityType}: dán mã định danh từ trang quản trị tương ứng.`}
          value={entityId}
          onChange={onChange}
          onPageReset={onPageReset}
        />
      );
  }
}

function AuditEntityUserPicker({
  entityId,
  onChange,
  onPageReset,
}: {
  entityId: string;
  onChange: (id: string | null) => void;
  onPageReset?: () => void;
}) {
  const [search, setSearch] = useState('');
  const listQuery = useAuditUserSearch(search, undefined, true);
  const labelQuery = useAuditUserLabel(entityId || null);

  const options = useMemo<AuditSearchOption[]>(
    () =>
      (listQuery.data ?? []).map(u => ({
        id: u.id,
        label: u.fullName || u.email,
        sublabel: u.email,
        badge: roleDisplayVi(u.role),
      })),
    [listQuery.data]
  );

  return (
    <AuditSearchPicker
      inputId="audit-entity-user"
      label="Entity đích — User"
      hint="Chọn tài khoản bị tác động."
      placeholder="Email, họ tên…"
      value={entityId}
      onChange={onChange}
      options={options}
      isLoading={listQuery.isFetching}
      resolved={labelQuery.data ?? null}
      onPageReset={onPageReset}
      onSearchChange={setSearch}
    />
  );
}

function AuditEntityReportPicker({
  entityId,
  onChange,
  onPageReset,
}: {
  entityId: string;
  onChange: (id: string | null) => void;
  onPageReset?: () => void;
}) {
  const [search, setSearch] = useState('');
  const listQuery = useAuditReportSearch(search, true);
  const labelQuery = useAuditReportLabel(entityId || null);

  const options = useMemo<AuditSearchOption[]>(
    () =>
      (listQuery.data ?? []).map(r => ({
        id: r.id,
        label: r.code,
        sublabel: r.address,
        badge: r.status,
      })),
    [listQuery.data]
  );

  return (
    <AuditSearchPicker
      inputId="audit-entity-report"
      label="Entity đích — Report"
      hint="Tìm theo mã báo cáo hoặc địa chỉ."
      placeholder="Mã REP, địa chỉ…"
      value={entityId}
      onChange={onChange}
      options={options}
      isLoading={listQuery.isFetching}
      resolved={labelQuery.data ?? null}
      onPageReset={onPageReset}
      onSearchChange={setSearch}
    />
  );
}

function AuditEntityCompanyPicker({
  entityId,
  onChange,
  onPageReset,
}: {
  entityId: string;
  onChange: (id: string | null) => void;
  onPageReset?: () => void;
}) {
  const [search, setSearch] = useState('');
  const listQuery = useAuditCompanySearch(search, true);
  const labelQuery = useAuditCompanyLabel(entityId || null);

  const options = useMemo<AuditSearchOption[]>(
    () =>
      (listQuery.data ?? []).map(c => ({
        id: c.id,
        label: c.name,
        sublabel: c.contractNumber,
        badge: String(c.status),
      })),
    [listQuery.data]
  );

  return (
    <AuditSearchPicker
      inputId="audit-entity-company"
      label="Entity đích — Company"
      hint="Tìm theo tên công ty hoặc số hợp đồng."
      placeholder="Tên công ty…"
      value={entityId}
      onChange={onChange}
      options={options}
      isLoading={listQuery.isFetching}
      resolved={labelQuery.data ?? null}
      onPageReset={onPageReset}
      onSearchChange={setSearch}
    />
  );
}

function AuditEntityPollutionCategoryPicker({
  entityId,
  onChange,
  onPageReset,
}: {
  entityId: string;
  onChange: (id: string | null) => void;
  onPageReset?: () => void;
}) {
  const [search, setSearch] = useState('');
  const listQuery = useAuditPollutionCategorySearch(search, true);

  const options = useMemo<AuditSearchOption[]>(
    () =>
      (listQuery.data ?? []).map(c => ({
        id: c.id,
        label: c.nameVi,
        sublabel: c.code,
      })),
    [listQuery.data]
  );

  const resolved = useMemo(() => {
    if (!entityId) return null;
    return options.find(o => o.id === entityId) ?? { id: entityId, label: entityId };
  }, [entityId, options]);

  return (
    <AuditSearchPicker
      inputId="audit-entity-pollution"
      label="Entity đích — PollutionCategory"
      hint="Tìm danh mục ô nhiễm."
      placeholder="Tên, mã danh mục…"
      value={entityId}
      onChange={onChange}
      options={options}
      isLoading={listQuery.isFetching}
      resolved={resolved}
      onPageReset={onPageReset}
      onSearchChange={setSearch}
    />
  );
}

function AuditEntityWasteTagPicker({
  entityId,
  onChange,
  onPageReset,
}: {
  entityId: string;
  onChange: (id: string | null) => void;
  onPageReset?: () => void;
}) {
  const [search, setSearch] = useState('');
  const listQuery = useAuditWasteTagSearch(search, true);

  const options = useMemo<AuditSearchOption[]>(
    () =>
      (listQuery.data ?? []).map(t => ({
        id: t.id,
        label: t.nameVi,
        sublabel: t.code,
      })),
    [listQuery.data]
  );

  const resolved = useMemo(() => {
    if (!entityId) return null;
    return options.find(o => o.id === entityId) ?? { id: entityId, label: entityId };
  }, [entityId, options]);

  return (
    <AuditSearchPicker
      inputId="audit-entity-wastetag"
      label="Entity đích — WasteTag"
      hint="Chọn thẻ loại rác."
      placeholder="Tên thẻ, mã…"
      value={entityId}
      onChange={onChange}
      options={options}
      isLoading={listQuery.isFetching}
      resolved={resolved}
      onPageReset={onPageReset}
      onSearchChange={setSearch}
    />
  );
}

function AuditEntityNotificationTemplatePicker({
  entityId,
  onChange,
  onPageReset,
}: {
  entityId: string;
  onChange: (id: string | null) => void;
  onPageReset?: () => void;
}) {
  const [search, setSearch] = useState('');
  const listQuery = useAuditNotificationTemplateSearch(search, true);

  const options = useMemo<AuditSearchOption[]>(
    () =>
      (listQuery.data ?? []).map(t => ({
        id: t.id,
        label: t.titleVi,
        sublabel: t.templateKey,
        badge: t.channel,
      })),
    [listQuery.data]
  );

  const resolved = useMemo(() => {
    if (!entityId) return null;
    return options.find(o => o.id === entityId) ?? { id: entityId, label: entityId };
  }, [entityId, options]);

  return (
    <AuditSearchPicker
      inputId="audit-entity-template"
      label="Entity đích — NotificationTemplate"
      hint="Chọn mẫu thông báo."
      placeholder="Tên hoặc mã mẫu…"
      value={entityId}
      onChange={onChange}
      options={options}
      isLoading={listQuery.isFetching}
      resolved={resolved}
      onPageReset={onPageReset}
      onSearchChange={setSearch}
    />
  );
}
