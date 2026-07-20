'use client';

import {
  useAssignOfficeOfficer,
  useChangeUserRole,
  useCreateDepartment,
  useCreateOffice,
  useOfficeDetail,
  useOrganizationUserSearch,
  useProvinces,
  useWards,
} from '@/hooks/useOrganization';
import type { Department } from '@/lib/api/models/department';
import type { Office } from '@/lib/api/models/office';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { normalizeApiRole } from '@/lib/constants/systemRoles';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { roleDisplayVi } from '@/utils/adminUserUi';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Tạo ủy ban (Sở)', desc: 'Department cấp tỉnh/TP' },
  { id: 2, title: 'Tạo phòng (Office)', desc: 'Văn phòng cấp phường/xã' },
  { id: 3, title: 'Gán cán bộ LEO', desc: 'Nâng role & phụ trách phòng' },
] as const;

const fieldClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

export function OrganizationOnboardingView() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [department, setDepartment] = useState<Department | null>(null);
  const [office, setOffice] = useState<Office | null>(null);

  const [deptName, setDeptName] = useState('');
  const [provinceCode, setProvinceCode] = useState('');

  const [officeName, setOfficeName] = useState('');
  const [wardCode, setWardCode] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const { data: provinces, isPending: provincesPending } = useProvinces();
  const { data: wards, isPending: wardsPending } = useWards(
    provinceCode || department?.provinceCode || null
  );

  const createDepartment = useCreateDepartment();
  const createOffice = useCreateOffice();
  const changeRole = useChangeUserRole();
  const assignOfficer = useAssignOfficeOfficer();

  const { data: officeDetail, refetch: refetchOffice } = useOfficeDetail(office?.id ?? null);

  const userSearchParams = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      ...(userSearch.trim() ? { search: userSearch.trim() } : {}),
    }),
    [userSearch]
  );

  const { data: userSearchResult, isPending: usersPending } = useOrganizationUserSearch(
    userSearchParams,
    step === 3
  );

  const effectiveProvince = provinceCode || department?.provinceCode || '';

  const handleCreateDepartment = () => {
    if (!deptName.trim() || !effectiveProvince) {
      toast.error('Vui lòng nhập tên ủy ban và chọn tỉnh/thành.');
      return;
    }
    createDepartment.mutate(
      { name: deptName.trim(), provinceCode: effectiveProvince.trim() },
      {
        onSuccess: env => {
          setDepartment(env.data);
          toast.success('Đã tạo ủy ban (department).');
          setStep(2);
        },
        onError: err =>
          toast.error(
            getAdminUserMutationError(err, 'Không thể tạo ủy ban. Tỉnh có thể đã có department.')
          ),
      }
    );
  };

  const handleCreateOffice = () => {
    if (!department) {
      toast.error('Hoàn thành bước 1 trước.');
      return;
    }
    if (!officeName.trim() || !wardCode) {
      toast.error('Vui lòng nhập tên phòng và chọn phường/xã.');
      return;
    }
    createOffice.mutate(
      {
        name: officeName.trim(),
        departmentId: department.id,
        wardCode: wardCode.trim(),
      },
      {
        onSuccess: env => {
          setOffice(env.data);
          toast.success('Đã tạo phòng (office).');
          setStep(3);
        },
        onError: err =>
          toast.error(
            getAdminUserMutationError(err, 'Không thể tạo phòng. Phường có thể đã có office.')
          ),
      }
    );
  };

  const handlePromoteToLeo = async (): Promise<boolean> => {
    if (!selectedUser) {
      toast.error('Chọn người dùng trước.');
      return false;
    }
    if (normalizeApiRole(selectedUser.role) === 'LEO') return true;

    try {
      await changeRole.mutateAsync({ userId: selectedUser.id, newRole: 'LEO' });
      setSelectedUser({ ...selectedUser, role: 'LEO' });
      toast.success('Đã đổi role sang LEO.');
      return true;
    } catch (err) {
      toast.error(getAdminUserMutationError(err, 'Không thể đổi role.'));
      return false;
    }
  };

  const handleAssignOfficer = async () => {
    if (!office) {
      toast.error('Hoàn thành bước 2 trước.');
      return;
    }
    if (!selectedUser) {
      toast.error('Chọn người dùng để gán LEO.');
      return;
    }

    const ok = await handlePromoteToLeo();
    if (!ok) return;

    assignOfficer.mutate(
      { id: office.id, body: { userId: selectedUser.id } },
      {
        onSuccess: () => {
          toast.success('Đã gán cán bộ phụ trách phòng.');
          void refetchOffice();
        },
        onError: err =>
          toast.error(getAdminUserMutationError(err, 'Không thể gán cán bộ. User cần role LEO.')),
      }
    );
  };

  const busy =
    createDepartment.isPending ||
    createOffice.isPending ||
    changeRole.isPending ||
    assignOfficer.isPending;

  return (
    <div className="w-full min-w-0 space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          Onboard tổ chức: tạo <strong>ủy ban</strong> (Sở TNMT tỉnh) → <strong>phòng</strong> (cấp
          phường) → gán <strong>LEO</strong> phụ trách.
        </p>
      </div>

      <ol className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        {STEPS.map(s => {
          const done =
            (s.id === 1 && department) ||
            (s.id === 2 && office) ||
            (s.id === 3 && officeDetail?.officerId);
          const active = step === s.id;
          return (
            <li
              key={s.id}
              className={`flex flex-1 items-start gap-3 rounded-card border p-4 ${
                active ? 'border-emerald-600/40 bg-emerald-50/50' : 'border-border bg-card'
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  done
                    ? 'bg-emerald-600 text-white'
                    : active
                      ? 'bg-emerald-600/20 text-emerald-900'
                      : 'bg-muted'
                }`}
              >
                {done ? <Check className="size-4" /> : s.id}
              </span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <section className="rounded-card border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Bước 1 — Tạo ủy ban (Department)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mỗi tỉnh/TP chỉ có một department. API: POST /v1/departments
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Tên ủy ban / Sở</label>
              <input
                type="text"
                value={deptName}
                onChange={e => setDeptName(e.target.value)}
                placeholder="Ủy ban nhân dân TP HCM"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Tỉnh / Thành phố</label>
              <select
                value={provinceCode}
                onChange={e => setProvinceCode(e.target.value)}
                className={fieldClass}
                disabled={provincesPending}
              >
                <option value="">— Chọn tỉnh/thành —</option>
                {(provinces ?? []).map(p => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={handleCreateDepartment}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {createDepartment.isPending && <Loader2 className="size-4 animate-spin" />}
              Tạo ủy ban
              <ChevronRight className="size-4" />
            </button>
          </div>
        </section>
      )}

      {step === 2 && department && (
        <section className="rounded-card border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Bước 2 — Tạo phòng (Office)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ủy ban: <strong>{department.name}</strong> (mã tỉnh {department.provinceCode}). API:
            POST /v1/offices
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Tên phòng / Văn phòng MT</label>
              <input
                type="text"
                value={officeName}
                onChange={e => setOfficeName(e.target.value)}
                placeholder="UBND phường Bến Thành"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Phường / Xã</label>
              <select
                value={wardCode}
                onChange={e => setWardCode(e.target.value)}
                className={fieldClass}
                disabled={wardsPending || !effectiveProvince}
              >
                <option value="">— Chọn phường/xã —</option>
                {(wards ?? []).map(w => (
                  <option key={w.code} value={w.code}>
                    {w.unitAbbreviation ? `${w.unitAbbreviation} ` : ''}
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Quay lại
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleCreateOffice}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {createOffice.isPending && <Loader2 className="size-4 animate-spin" />}
              Tạo phòng
              <ChevronRight className="size-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && office && (
        <section className="rounded-card border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Bước 3 — Gán cán bộ LEO</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Phòng: <strong>{office.name}</strong> · Mã phường {office.wardCode}. Đổi role PUT
            /v1/admin/users/&#123;id&#125;/role · Gán PUT /v1/offices/&#123;id&#125;/officer
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tìm người dùng (email, họ tên)</label>
              <input
                type="search"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Nhập để tìm..."
                className={fieldClass}
              />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              {usersPending && <p className="p-4 text-sm text-muted-foreground">Đang tìm...</p>}
              {!usersPending && (userSearchResult?.items.length ?? 0) === 0 && (
                <p className="p-4 text-sm text-muted-foreground">Không có kết quả.</p>
              )}
              <ul>
                {(userSearchResult?.items ?? []).map(u => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-muted/50 ${
                        selectedUser?.id === u.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <span>
                        <span className="font-medium">{u.fullName}</span>
                        <span className="block text-xs text-muted-foreground">{u.email}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                        {roleDisplayVi(u.role)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {selectedUser && (
              <p className="text-sm">
                Đã chọn: <strong>{selectedUser.fullName}</strong> — hiện role{' '}
                <strong>{roleDisplayVi(selectedUser.role)}</strong>
                {normalizeApiRole(selectedUser.role) !== 'LEO' && (
                  <span className="text-amber-800"> (sẽ nâng lên LEO khi gán)</span>
                )}
              </p>
            )}
          </div>

          {officeDetail && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
              <p className="font-medium text-emerald-900">Trạng thái phòng</p>
              <p className="mt-1 text-muted-foreground">
                Onboarded: {officeDetail.isOnboarded ? 'Có' : 'Chưa'} · Officer:{' '}
                {officeDetail.officerName ?? '—'}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Quay lại
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !selectedUser}
                onClick={() => void handlePromoteToLeo()}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Chỉ đổi role → LEO
              </button>
              <button
                type="button"
                disabled={busy || !selectedUser}
                onClick={() => void handleAssignOfficer()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {(changeRole.isPending || assignOfficer.isPending) && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Gán LEO phụ trách
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
