'use client';

import { SearchableSelect } from '@/components/common/SearchableSelect';
import { LeoUserPicker } from '@/components/admin/offices/LeoUserPicker';
import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import {
  OfficeOnboardingStepper,
  type OfficeOnboardingStep,
} from '@/components/admin/offices/OfficeOnboardingStepper';
import {
  useAssignOfficeOfficer,
  useCreateDepartment,
  useCreateOffice,
  useProvinces,
  useWards,
} from '@/hooks/useOffices';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const STEPS: readonly OfficeOnboardingStep[] = [
  { id: 1, title: 'Tạo ủy ban', desc: 'Sở / tỉnh' },
  { id: 2, title: 'Tạo văn phòng', desc: 'Phường / xã' },
  { id: 3, title: 'Gán LEO', desc: 'Phụ trách' },
];

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

interface OfficeCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function OfficeCreateDialog({ open, onClose, onCompleted }: OfficeCreateDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [allStepsDone, setAllStepsDone] = useState(false);

  const [deptName, setDeptName] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const { data: provinces, isPending: provincesPending } = useProvinces();
  const { data: wards, isPending: wardsPending } = useWards(provinceCode || null);

  const createDepartment = useCreateDepartment();
  const createOffice = useCreateOffice();
  const assignOfficer = useAssignOfficeOfficer();

  const provinceOptions = useMemo(
    () =>
      (provinces ?? []).map(p => ({
        value: p.code,
        label: p.name,
        keywords: p.code,
      })),
    [provinces]
  );

  const wardOptions = useMemo(
    () =>
      (wards ?? []).map(w => ({
        value: w.code,
        label: `${w.unitAbbreviation ? `${w.unitAbbreviation} ` : ''}${w.name}`,
        keywords: `${w.code} ${w.unitAbbreviation ?? ''}`,
      })),
    [wards]
  );

  const completedThrough = allStepsDone ? 3 : Math.max(0, step - 1);

  const resetForm = () => {
    setStep(1);
    setAllStepsDone(false);
    setDeptName('');
    setProvinceCode('');
    setOfficeName('');
    setWardCode('');
    setUserSearch('');
    setSelectedUser(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const goToStep2 = () => {
    if (!deptName.trim() || !provinceCode.trim()) {
      toast.error('Vui lòng nhập tên ủy ban và chọn tỉnh/thành.');
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    if (!officeName.trim() || !wardCode) {
      toast.error('Vui lòng nhập tên phòng và chọn phường/xã.');
      return;
    }
    setStep(3);
  };

  const handleFinish = async () => {
    if (!selectedUser) {
      toast.error('Chọn LEO chưa được gán văn phòng.');
      return;
    }

    try {
      const deptEnv = await createDepartment.mutateAsync({
        name: deptName.trim(),
        provinceCode: provinceCode.trim(),
      });
      const officeEnv = await createOffice.mutateAsync({
        name: officeName.trim(),
        departmentId: deptEnv.data.id,
        wardCode: wardCode.trim(),
      });
      await assignOfficer.mutateAsync({
        officeId: officeEnv.data.id,
        body: { userId: selectedUser.id },
      });
      setAllStepsDone(true);
      toast.success('Đã tạo văn phòng và gán LEO phụ trách.');
      onCompleted?.();
      handleClose();
    } catch (err) {
      toast.error(
        getAdminUserMutationError(
          err,
          'Không thể hoàn tất. Kiểm tra dữ liệu (tỉnh/phường đã tồn tại, LEO hợp lệ).'
        )
      );
    }
  };

  const busy = createDepartment.isPending || createOffice.isPending || assignOfficer.isPending;

  return (
    <OfficeDialogShell
      open={open}
      title="Tạo văn phòng địa phương"
      titleId="office-create-title"
      onClose={handleClose}
      size="full"
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Tạo ủy ban (Sở) → văn phòng (phường/xã) → gán LEO phụ trách. Dữ liệu chỉ lưu khi bấm{' '}
        <strong className="font-medium text-foreground">Hoàn tất</strong> ở bước cuối.
      </p>

      <OfficeOnboardingStepper
        steps={STEPS}
        currentStep={step}
        completedThrough={completedThrough}
      />

      {step === 1 && (
        <div className="mt-2 flex flex-col">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên ủy ban / Sở</label>
              <input
                type="text"
                value={deptName}
                onChange={e => setDeptName(e.target.value)}
                placeholder="Ủy ban nhân dân TP HCM"
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tỉnh / Thành phố</label>
              <SearchableSelect
                id="office-create-province"
                options={provinceOptions}
                value={provinceCode}
                onChange={setProvinceCode}
                placeholder="— Chọn tỉnh/thành —"
                searchPlaceholder="Tìm tên hoặc mã tỉnh…"
                loading={provincesPending}
                disabled={provincesPending}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end border-t border-border pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={goToStep2}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              Tiếp tục
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-2 flex flex-col">
          <p className="mb-6 rounded-lg bg-muted/40 px-4 py-3 text-sm">
            Ủy ban: <strong className="text-foreground">{deptName.trim()}</strong>
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên văn phòng MT</label>
              <input
                type="text"
                value={officeName}
                onChange={e => setOfficeName(e.target.value)}
                placeholder="UBND phường Bến Thành"
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phường / Xã</label>
              <SearchableSelect
                id="office-create-ward"
                options={wardOptions}
                value={wardCode}
                onChange={setWardCode}
                placeholder="— Chọn phường/xã —"
                searchPlaceholder="Tìm tên phường/xã…"
                loading={wardsPending}
                disabled={wardsPending || !provinceCode}
                emptyMessage={provinceCode ? 'Không có phường/xã.' : 'Chọn tỉnh/thành trước.'}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted"
            >
              Quay lại
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={goToStep3}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              Tiếp tục
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-2 flex flex-col">
          <p className="mb-6 rounded-lg bg-muted/40 px-4 py-3 text-sm">
            Phòng: <strong className="text-foreground">{officeName.trim()}</strong>
            {selectedUser && (
              <span className="ml-2 text-muted-foreground">· LEO: {selectedUser.fullName}</span>
            )}
          </p>
          <LeoUserPicker
            enabled={open && step === 3}
            search={userSearch}
            onSearchChange={setUserSearch}
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            inputId="office-create-leo-search"
          />
          <div className="mt-6 flex justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={busy}
              className="h-11 rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Quay lại
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="h-11 rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy || !selectedUser}
                onClick={() => void handleFinish()}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
