'use client';

import {
  OfficeWardSelect,
  type OfficeWardDepartmentMeta,
} from '@/components/officer/companies/OfficeWardSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCompany, useUpdateCompanyServiceAreas } from '@/hooks/useCompany';
import { ensureMyOfficesData } from '@/hooks/useDepartments';
import {
  COMPANY_CONTRACT_TYPES,
  type CompanyContractType,
  type CompanyListItem,
  type CreatedCompany,
} from '@/lib/api/models/company';
import { getCompanyMutationError } from '@/utils/companyErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Check, Copy, Loader2, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
const schema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập tên doanh nghiệp').max(200, 'Tối đa 200 ký tự'),
    taxCode: z.string().min(1, 'Vui lòng nhập mã số thuế').max(20, 'Tối đa 20 ký tự'),
    address: z.string().min(1, 'Vui lòng nhập địa chỉ').max(500, 'Tối đa 500 ký tự'),
    phone: z.string().min(1, 'Vui lòng nhập số điện thoại').max(20, 'Tối đa 20 ký tự'),
    email: z.string().email('Email công ty không hợp lệ'),
    contractNumber: z.string().min(1, 'Vui lòng nhập số hợp đồng').max(100, 'Tối đa 100 ký tự'),
    contractType: z.enum(COMPANY_CONTRACT_TYPES, {
      message: 'Vui lòng chọn loại hợp đồng',
    }),
    contractStartDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    contractEndDate: z.string(),
    managerFullName: z.string().min(1, 'Vui lòng nhập họ tên quản lý').max(200, 'Tối đa 200 ký tự'),
    managerEmail: z.string().email('Email quản lý không hợp lệ'),
  })
  .superRefine((data, ctx) => {
    const endDate = data.contractEndDate.trim();

    if (data.contractType === 'Bidding' && !endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Vui lòng chọn ngày kết thúc (bắt buộc với Bidding)',
        path: ['contractEndDate'],
      });
    }

    if (endDate && data.contractStartDate && endDate < data.contractStartDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
        path: ['contractEndDate'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:opacity-60';

const sectionLabelClass =
  'mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase';

function dateInputToIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function companyToFormValues(company: CompanyListItem): FormValues {
  return {
    name: company.name,
    taxCode: company.taxCode,
    address: '',
    phone: company.phone,
    email: company.email,
    contractNumber: company.contractNumber,
    contractType: company.contractType,
    contractStartDate: isoToDateInput(company.contractStartDate),
    contractEndDate: company.contractEndDate ? isoToDateInput(company.contractEndDate) : '',
    managerFullName: '',
    managerEmail: '',
  };
}

function resolveContractEndDate(
  contractType: CompanyContractType,
  contractEndDate: string
): string | null {
  const trimmed = contractEndDate.trim();
  if (contractType === 'Subsidiary' && !trimmed) return null;
  if (!trimmed) return null;
  return dateInputToIso(trimmed);
}

const defaultValues: FormValues = {
  name: '',
  taxCode: '',
  address: '',
  phone: '',
  email: '',
  contractNumber: '',
  contractType: 'Subsidiary' satisfies CompanyContractType,
  contractStartDate: '',
  contractEndDate: '',
  managerFullName: '',
  managerEmail: '',
};

type CompanyDialogMode = 'create' | 'assign';

interface CompanyCreateDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: CompanyDialogMode;
  assignCompany?: CompanyListItem | null;
  onCreated?: () => void;
  onAssigned?: () => void;
}

export function CompanyCreateDialog({
  open,
  onClose,
  mode = 'create',
  assignCompany = null,
  onCreated,
  onAssigned,
}: CompanyCreateDialogProps) {
  const isAssignMode = mode === 'assign' && assignCompany != null;

  const [createdResult, setCreatedResult] = useState<CreatedCompany | null>(null);
  const [copied, setCopied] = useState(false);
  const [wardCode, setWardCode] = useState('');
  const [wardError, setWardError] = useState<string | undefined>();
  const [departmentMeta, setDepartmentMeta] = useState<OfficeWardDepartmentMeta | null>(null);
  const [wardLoadError, setWardLoadError] = useState(false);

  const queryClient = useQueryClient();

  const createMutation = useCreateCompany();
  const updateServiceAreasMutation = useUpdateCompanyServiceAreas();

  const isPending = createMutation.isPending || updateServiceAreasMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const contractType = watch('contractType');
  const isBiddingContract = contractType === 'Bidding';

  useEffect(() => {
    if (isAssignMode || contractType !== 'Subsidiary') return;
    setValue('contractEndDate', '');
    clearErrors('contractEndDate');
  }, [contractType, isAssignMode, setValue, clearErrors]);

  useEffect(() => {
    if (!open) return;
    setCreatedResult(null);
    setCopied(false);
    setWardError(undefined);
    setWardCode('');
    setDepartmentMeta(null);
    setWardLoadError(false);
    if (isAssignMode && assignCompany) {
      reset(companyToFormValues(assignCompany));
    } else {
      reset(defaultValues);
    }
  }, [open, isAssignMode, assignCompany, reset]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const onSubmit = handleSubmit(async values => {
    let departmentId = departmentMeta?.departmentId;

    if (!departmentId) {
      try {
        const offices = await ensureMyOfficesData(queryClient);
        departmentId = offices.departmentId;
      } catch {
        toast.error('Không xác định được Sở TNMT của tài khoản đăng nhập.');
        return;
      }
    }

    if (!departmentId) {
      toast.error('Không xác định được Sở TNMT của tài khoản đăng nhập.');
      return;
    }

    const trimmedWard = wardCode.trim();

    createMutation.mutate(
      {
        name: values.name.trim(),
        departmentId,
        taxCode: values.taxCode.trim(),
        address: values.address.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        contractNumber: values.contractNumber.trim(),
        contractType: values.contractType,
        contractStartDate: dateInputToIso(values.contractStartDate),
        contractEndDate: resolveContractEndDate(values.contractType, values.contractEndDate),
        managerFullName: values.managerFullName.trim(),
        managerEmail: values.managerEmail.trim(),
        ...(trimmedWard ? { wardCodes: [trimmedWard] } : {}),
      },
      {
        onSuccess: envelope => {
          setCreatedResult(envelope.data);
          toast.success('Đã tạo doanh nghiệp và tài khoản quản lý.');
          onCreated?.();
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể tạo doanh nghiệp.')),
      }
    );
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCompany) return;

    const trimmed = wardCode.trim();
    if (!trimmed) {
      setWardError('Vui lòng chọn địa bàn vận hành (phường/xã)');
      return;
    }

    setWardError(undefined);
    updateServiceAreasMutation.mutate(
      {
        companyId: assignCompany.id,
        body: { wardCodes: [trimmed] },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật địa bàn phụ trách.');
          onAssigned?.();
          onClose();
        },
        onError: err =>
          toast.error(getCompanyMutationError(err, 'Không thể cập nhật địa bàn phụ trách.')),
      }
    );
  };

  const handleCopyPassword = async () => {
    if (!createdResult?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(createdResult.tempPassword);
      setCopied(true);
      toast.success('Đã sao chép mật khẩu tạm.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép. Vui lòng sao chép thủ công.');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 sm:p-6"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={isAssignMode ? 'company-assign-title' : 'company-create-title'}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending}
          className="absolute top-4 right-4 rounded-lg p-2 text-muted-foreground transition hover:bg-muted disabled:opacity-60 sm:top-5 sm:right-5"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
            {isAssignMode ? (
              <MapPin className="size-6" aria-hidden />
            ) : (
              <Building2 className="size-6" aria-hidden />
            )}
          </div>
          {isAssignMode ? (
            <>
              <h2
                id="company-assign-title"
                className="text-xl font-bold tracking-tight text-foreground"
              >
                Gán địa bàn
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{assignCompany?.name}</p>
            </>
          ) : (
            <>
              <h2
                id="company-create-title"
                className="text-xl font-bold tracking-tight text-foreground"
              >
                Thêm doanh nghiệp DVMT
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Tạo hồ sơ công ty và tài khoản quản lý (CM)
              </p>
            </>
          )}
        </div>

        {createdResult && !isAssignMode ? (
          <CompanyCreateSuccess
            result={createdResult}
            copied={copied}
            onCopyPassword={handleCopyPassword}
            onClose={handleClose}
          />
        ) : (
          <form onSubmit={isAssignMode ? handleAssignSubmit : onSubmit} className="space-y-6">
            <section>
              <p className={sectionLabelClass}>Địa bàn vận hành</p>
              <FormField
                label={
                  isAssignMode
                    ? 'Gán địa bàn vận hành (phường/xã)'
                    : 'Gán địa bàn vận hành (phường/xã) — tùy chọn'
                }
                hint={
                  departmentMeta?.departmentName
                    ? `Thuộc ${departmentMeta.departmentName}`
                    : 'Thuộc Ủy ban nhân dân Thành phố Hồ Chí Minh'
                }
                error={
                  wardError ??
                  (wardLoadError ? 'Không tải được danh sách văn phòng cấp phường/xã.' : undefined)
                }
              >
                <OfficeWardSelect
                  id={isAssignMode ? 'company-assign-service-area' : 'company-create-service-area'}
                  value={wardCode}
                  onChange={v => {
                    setWardCode(v);
                    setWardError(undefined);
                  }}
                  active={open}
                  placeholder="— Chọn văn phòng MT phường/xã —"
                  searchPlaceholder="Tìm phường, xã hoặc tên văn phòng…"
                  disabled={isPending}
                  onDepartmentMeta={setDepartmentMeta}
                  onLoadError={setWardLoadError}
                />
              </FormField>
            </section>

            <section>
              <p className={sectionLabelClass}>Thông tin doanh nghiệp</p>
              <div className="space-y-4">
                <FormField
                  label="Tên doanh nghiệp"
                  error={isAssignMode ? undefined : errors.name?.message}
                >
                  <input
                    id="company-name"
                    {...register('name')}
                    placeholder="Công ty TNHH Môi trường Xanh"
                    className={fieldClass}
                    disabled={isPending || isAssignMode}
                    readOnly={isAssignMode}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Mã số thuế"
                    error={isAssignMode ? undefined : errors.taxCode?.message}
                  >
                    <input
                      id="company-tax"
                      {...register('taxCode')}
                      placeholder="0123456789"
                      className={fieldClass}
                      disabled={isPending || isAssignMode}
                      readOnly={isAssignMode}
                    />
                  </FormField>
                  <FormField
                    label="Số điện thoại"
                    error={isAssignMode ? undefined : errors.phone?.message}
                  >
                    <input
                      id="company-phone"
                      {...register('phone')}
                      placeholder="0901234567"
                      className={fieldClass}
                      disabled={isPending || isAssignMode}
                      readOnly={isAssignMode}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Email công ty"
                  error={isAssignMode ? undefined : errors.email?.message}
                >
                  <input
                    id="company-email"
                    type="email"
                    {...register('email')}
                    placeholder="contact@company.vn"
                    className={fieldClass}
                    disabled={isPending || isAssignMode}
                    readOnly={isAssignMode}
                  />
                </FormField>

                <FormField
                  label="Địa chỉ"
                  error={isAssignMode ? undefined : errors.address?.message}
                >
                  <input
                    id="company-address"
                    {...register('address')}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    className={fieldClass}
                    disabled={isPending || isAssignMode}
                    readOnly={isAssignMode}
                  />
                </FormField>
              </div>
            </section>

            <section>
              <p className={sectionLabelClass}>Hợp đồng</p>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Số hợp đồng"
                    error={isAssignMode ? undefined : errors.contractNumber?.message}
                  >
                    <input
                      id="company-contract-number"
                      {...register('contractNumber')}
                      placeholder="HD-2026-001"
                      className={fieldClass}
                      disabled={isPending || isAssignMode}
                      readOnly={isAssignMode}
                    />
                  </FormField>
                  <FormField
                    label="Loại hợp đồng"
                    error={isAssignMode ? undefined : errors.contractType?.message}
                  >
                    <Select
                      value={contractType}
                      onValueChange={v =>
                        setValue('contractType', v as CompanyContractType, { shouldValidate: true })
                      }
                      disabled={isPending || isAssignMode}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_CONTRACT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Ngày bắt đầu"
                    error={isAssignMode ? undefined : errors.contractStartDate?.message}
                  >
                    <input
                      id="company-contract-start"
                      type="date"
                      {...register('contractStartDate')}
                      className={fieldClass}
                      disabled={isPending || isAssignMode}
                      readOnly={isAssignMode}
                    />
                  </FormField>
                  <FormField
                    label={isBiddingContract ? 'Ngày kết thúc' : 'Ngày kết thúc'}
                    error={isAssignMode ? undefined : errors.contractEndDate?.message}
                  >
                    <input
                      id="company-contract-end"
                      type="date"
                      {...register('contractEndDate')}
                      className={fieldClass}
                      disabled={isPending || isAssignMode}
                      readOnly={isAssignMode}
                      aria-required={isBiddingContract && !isAssignMode}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            <section>
              <p className={sectionLabelClass}>Tài khoản quản lý (CM)</p>
              <div className="space-y-4">
                <FormField
                  label="Họ và tên"
                  error={isAssignMode ? undefined : errors.managerFullName?.message}
                >
                  <input
                    id="company-manager-name"
                    {...register('managerFullName')}
                    placeholder="Nguyễn Văn A"
                    className={fieldClass}
                    disabled={isPending || isAssignMode}
                    readOnly={isAssignMode}
                  />
                </FormField>
                <FormField
                  label="Email quản lý"
                  error={isAssignMode ? undefined : errors.managerEmail?.message}
                >
                  <input
                    id="company-manager-email"
                    type="email"
                    {...register('managerEmail')}
                    placeholder="manager@company.vn"
                    className={fieldClass}
                    disabled={isPending || isAssignMode}
                    readOnly={isAssignMode}
                  />
                </FormField>
              </div>
            </section>

            <button
              type="submit"
              disabled={isPending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isAssignMode ? 'Lưu địa bàn' : 'Tạo doanh nghiệp'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CompanyCreateSuccess({
  result,
  copied,
  onCopyPassword,
  onClose,
}: {
  result: CreatedCompany;
  copied: boolean;
  onCopyPassword: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-medium text-emerald-900">Đã tạo {result.companyName}</p>
        <p className="mt-1 text-xs text-emerald-800/80">
          Trạng thái: {result.status} · Hợp đồng {result.contractNumber}
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-xs font-medium text-amber-900">
          Mật khẩu tạm cho {result.managerEmail} — chỉ hiển thị một lần
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-slate-800">
            {result.tempPassword}
          </code>
          <button
            type="button"
            onClick={onCopyPassword}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Đã copy' : 'Sao chép'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Đóng
      </button>
    </div>
  );
}
