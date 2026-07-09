'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  OfficeWardSelect,
  type OfficeWardDepartmentMeta,
} from '@/components/officer/companies/OfficeWardSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { canAccessCompanies } from '@/lib/constants/officerRoles';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { useAuthStore } from '@/lib/store/authStore';
import { getCompanyMutationError } from '@/utils/companyErrors';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Calendar,
  Check,
  Copy,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  UserCog,
} from 'lucide-react';
import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
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

const inputClass = 'h-11 pl-10';

function dateInputToIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
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

const CREATE_SIDEBAR_ITEMS = [
  {
    icon: MapPin,
    title: 'Địa bàn vận hành',
    description: 'Gán phường/xã qua văn phòng MT',
  },
  {
    icon: UserCog,
    title: 'Tài khoản quản lý',
    description: 'Tạo CM kèm mật khẩu tạm',
  },
  {
    icon: FileText,
    title: 'Loại hợp đồng',
    description: 'Subsidiary hoặc Bidding',
  },
  {
    icon: Building2,
    title: 'Trạng thái ban đầu',
    description: 'Chờ kích hoạt sau khi tạo',
  },
] as const;

export function CompanyCreatePageClient() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const [createdResult, setCreatedResult] = useState<CreatedCompany | null>(null);
  const [copied, setCopied] = useState(false);
  const [wardCode, setWardCode] = useState('');
  const [wardError, setWardError] = useState<string | undefined>();
  const [departmentMeta, setDepartmentMeta] = useState<OfficeWardDepartmentMeta | null>(null);
  const [wardLoadError, setWardLoadError] = useState(false);

  const queryClient = useQueryClient();
  const createMutation = useCreateCompany();
  const isPending = createMutation.isPending;

  const {
    register,
    handleSubmit,
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
    if (contractType !== 'Subsidiary') return;
    setValue('contractEndDate', '');
    clearErrors('contractEndDate');
  }, [contractType, setValue, clearErrors]);

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
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể tạo doanh nghiệp.')),
      }
    );
  });

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

  if (!canAccessCompanies(user?.systemRole)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Không có quyền truy cập</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Danh sách doanh nghiệp chỉ dành cho cán bộ Sở TNMT (DEO).
        </p>
        <Button asChild className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">
          <Link href={getDefaultOfficerHomePath(user?.systemRole)}>Về trang chính</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doanh nghiệp</h1>
        <nav className="mt-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/officer/companies" className="hover:text-slate-700 hover:underline">
            Doanh nghiệp
          </Link>
          <span className="mx-1.5 text-slate-400">/</span>
          <span className="text-slate-700">Thêm mới</span>
        </nav>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="border-slate-200 shadow-sm">
          {createdResult ? (
            <CardContent className="p-6 sm:p-8">
              <CompanyCreateSuccess
                result={createdResult}
                copied={copied}
                onCopyPassword={handleCopyPassword}
                onClose={() => router.push('/officer/companies')}
              />
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-1 border-b border-slate-100 px-6 pb-5 pt-6">
                <CardTitle className="text-xl font-bold">Thêm doanh nghiệp DVMT</CardTitle>
                <CardDescription>
                  Nhập thông tin công ty và tài khoản quản lý để lưu hồ sơ.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-5">
                <form onSubmit={onSubmit} className="space-y-5">
                  <FormField
                    label="Gán địa bàn vận hành (phường/xã)"
                    error={
                      wardError ??
                      (wardLoadError
                        ? 'Không tải được danh sách văn phòng cấp phường/xã.'
                        : undefined)
                    }
                  >
                    <OfficeWardSelect
                      id="company-create-service-area"
                      value={wardCode}
                      onChange={v => {
                        setWardCode(v);
                        setWardError(undefined);
                      }}
                      active
                      placeholder="Chọn văn phòng MT phường/xã"
                      searchPlaceholder="Tìm phường, xã hoặc tên văn phòng…"
                      disabled={isPending}
                      onDepartmentMeta={setDepartmentMeta}
                      onLoadError={setWardLoadError}
                    />
                  </FormField>

                  <FormField label="Tên doanh nghiệp" error={errors.name?.message}>
                    <IconInput
                      icon={Building2}
                      id="company-name"
                      placeholder="Công ty TNHH Môi trường Xanh"
                      disabled={isPending}
                      {...register('name')}
                    />
                  </FormField>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Mã số thuế" error={errors.taxCode?.message}>
                      <IconInput
                        icon={FileText}
                        id="company-tax"
                        placeholder="0123456789"
                        disabled={isPending}
                        {...register('taxCode')}
                      />
                    </FormField>
                    <FormField label="Số điện thoại" error={errors.phone?.message}>
                      <IconInput
                        icon={Phone}
                        id="company-phone"
                        placeholder="0901234567"
                        disabled={isPending}
                        {...register('phone')}
                      />
                    </FormField>
                  </div>

                  <FormField label="Email công ty" error={errors.email?.message}>
                    <IconInput
                      icon={Mail}
                      id="company-email"
                      type="email"
                      placeholder="contact@company.vn"
                      disabled={isPending}
                      {...register('email')}
                    />
                  </FormField>

                  <FormField label="Địa chỉ" error={errors.address?.message}>
                    <IconInput
                      icon={MapPin}
                      id="company-address"
                      placeholder="123 Đường ABC, Quận 1, TP.HCM"
                      disabled={isPending}
                      {...register('address')}
                    />
                  </FormField>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Số hợp đồng" error={errors.contractNumber?.message}>
                      <IconInput
                        icon={FileText}
                        id="company-contract-number"
                        placeholder="HD-2026-001"
                        disabled={isPending}
                        {...register('contractNumber')}
                      />
                    </FormField>
                    <FormField label="Loại hợp đồng" error={errors.contractType?.message}>
                      <Select
                        value={contractType}
                        onValueChange={v =>
                          setValue('contractType', v as CompanyContractType, {
                            shouldValidate: true,
                          })
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-11">
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

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Ngày bắt đầu" error={errors.contractStartDate?.message}>
                      <IconInput
                        icon={Calendar}
                        id="company-contract-start"
                        type="date"
                        disabled={isPending}
                        className="pl-10"
                        {...register('contractStartDate')}
                      />
                    </FormField>
                    <FormField label="Ngày kết thúc" error={errors.contractEndDate?.message}>
                      <IconInput
                        icon={Calendar}
                        id="company-contract-end"
                        type="date"
                        disabled={isPending}
                        aria-required={isBiddingContract}
                        {...register('contractEndDate')}
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Họ và tên quản lý" error={errors.managerFullName?.message}>
                      <IconInput
                        icon={User}
                        id="company-manager-name"
                        placeholder="Nguyễn Văn A"
                        disabled={isPending}
                        {...register('managerFullName')}
                      />
                    </FormField>
                    <FormField label="Email quản lý" error={errors.managerEmail?.message}>
                      <IconInput
                        icon={Mail}
                        id="company-manager-email"
                        type="email"
                        placeholder="manager@company.vn"
                        disabled={isPending}
                        {...register('managerEmail')}
                      />
                    </FormField>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-10 min-w-[7rem] bg-slate-200 text-slate-900 hover:bg-slate-300"
                    >
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Lưu
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      className="h-10 min-w-[7rem]"
                      onClick={() => router.push('/officer/companies')}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <Card className="h-fit border-slate-200 shadow-sm">
          <CardHeader className="px-5 pb-3 pt-5">
            <CardTitle className="text-base font-semibold">Thông tin hồ sơ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-3 pb-4">
            {CREATE_SIDEBAR_ITEMS.map(item => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  <item.icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface CompanyAssignAreaDialogProps {
  open: boolean;
  onClose: () => void;
  assignCompany: CompanyListItem | null;
  onAssigned?: () => void;
}

export function CompanyAssignAreaDialog({
  open,
  onClose,
  assignCompany,
  onAssigned,
}: CompanyAssignAreaDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg gap-0 overflow-y-auto rounded-2xl p-6 sm:p-8">
        {open && assignCompany ? (
          <CompanyAssignAreaDialogForm
            assignCompany={assignCompany}
            onClose={onClose}
            onAssigned={onAssigned}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CompanyAssignAreaDialogForm({
  assignCompany,
  onClose,
  onAssigned,
}: {
  assignCompany: CompanyListItem;
  onClose: () => void;
  onAssigned?: () => void;
}) {
  const [wardCode, setWardCode] = useState('');
  const [wardError, setWardError] = useState<string | undefined>();
  const [wardLoadError, setWardLoadError] = useState(false);

  const updateServiceAreasMutation = useUpdateCompanyServiceAreas();
  const isPending = updateServiceAreasMutation.isPending;

  const handleAssignSubmit = (e: FormEvent) => {
    e.preventDefault();

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

  return (
    <>
      <DialogHeader className="mb-6 items-center space-y-0 text-center sm:text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
          <MapPin className="size-6" aria-hidden />
        </div>
        <DialogTitle className="text-xl font-bold tracking-tight">Gán địa bàn</DialogTitle>
        <DialogDescription>{assignCompany.name}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleAssignSubmit} className="space-y-4">
        <FormField
          label="Gán địa bàn vận hành (phường/xã)"
          error={
            wardError ??
            (wardLoadError ? 'Không tải được danh sách văn phòng cấp phường/xã.' : undefined)
          }
        >
          <OfficeWardSelect
            id="company-assign-service-area"
            value={wardCode}
            onChange={v => {
              setWardCode(v);
              setWardError(undefined);
            }}
            active
            placeholder="Chọn văn phòng MT phường/xã"
            searchPlaceholder="Tìm phường, xã hoặc tên văn phòng…"
            disabled={isPending}
            onLoadError={setWardLoadError}
          />
        </FormField>

        <FormField label="Tên doanh nghiệp">
          <Input
            id="company-assign-name"
            className="h-11"
            disabled
            readOnly
            value={assignCompany.name}
          />
        </FormField>

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Lưu địa bàn
        </Button>
      </form>
    </>
  );
}

function IconInput({
  icon: Icon,
  className,
  ...props
}: ComponentProps<typeof Input> & { icon: typeof Building2 }) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input className={`${inputClass} ${className ?? ''}`} {...props} />
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="block px-0.5 pb-1.5 text-sm font-medium">{label}</Label>
      {children}
      {error ? <p className="px-0.5 pt-0.5 text-xs text-destructive">{error}</p> : null}
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
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="size-6" aria-hidden />
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
          Tạo doanh nghiệp thành công
        </h2>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{result.companyName}</p>
          <p>
            Trạng thái: {result.status} · Hợp đồng {result.contractNumber}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
        <Label htmlFor="company-temp-password" className="text-xs font-medium text-amber-900">
          Mật khẩu tạm cho {result.managerEmail}
        </Label>
        <p className="text-xs text-amber-800/80">
          Chỉ hiển thị một lần — hãy sao chép trước khi rời trang.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Input
            id="company-temp-password"
            readOnly
            value={result.tempPassword}
            className="h-10 flex-1 border-amber-200 bg-white text-sm text-slate-800"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCopyPassword}
            className="h-10 shrink-0 gap-1.5 border-amber-200 bg-white text-xs hover:bg-amber-50"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Đã copy' : 'Sao chép'}
          </Button>
        </div>
      </div>

      <Button
        type="button"
        onClick={onClose}
        className="h-11 w-full bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Về danh sách
      </Button>
    </div>
  );
}
