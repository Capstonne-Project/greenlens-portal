/** POST /v1/companies — request body. */
import type { CompanyContractType } from '@/lib/api/models/company';

export interface CreateCompanyBodyDto {
  name: string;
  departmentId: string;
  contractNumber: string;
  contractStartDate: string;
  contractEndDate: string | null;
  contractType: CompanyContractType;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  /** Tùy chọn — tạo tài khoản CM khi có giá trị. */
  managerEmail?: string;
  managerFullName?: string;
  /** Tùy chọn — gán phường/xã phụ trách ngay khi tạo. */
  wardCodes?: string[];
}

/** POST /v1/companies — 201 data. */
export interface CreateCompanyDataDto {
  companyId: string;
  companyName: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: string;
  managerUserId: string;
  managerEmail: string;
  tempPassword: string;
}

/** GET /v1/companies — item trong `items[]`. */
export interface CompanyListItemDto {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: string;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  phone: string;
  email: string;
  serviceAreaCount: number;
  staffCount: number;
  createdAt: string;
}

export interface CompanyPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** GET /v1/companies — data envelope. */
export interface CompaniesListDataDto {
  items: CompanyListItemDto[];
  pagination: CompanyPaginationDto;
}

/** GET /v1/companies/my-ward — item trong `companies[]`. */
export interface MyWardCompanyItemDto {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: string;
  phone: string;
  email: string;
  serviceAreaCount: number;
  staffCount: number;
}

/** GET /v1/companies/my-ward — data envelope. */
export interface MyWardCompaniesDataDto {
  companies: MyWardCompanyItemDto[];
}

/** GET /v1/companies/{id}/service-areas — data */
export interface CompanyServiceAreasDataDto {
  wardCodes: string[];
}

/** PUT /v1/companies/{id}/service-areas — request body */
export interface UpdateCompanyServiceAreasBodyDto {
  wardCodes: string[];
}

/** GET /v1/companies/{id}/service-areas — item */
export interface CompanyServiceAreaDto {
  id: string;
  wardCode: string;
  wardName: string;
  provinceCode: string;
}

/** GET /v1/companies/{id} — data */
export interface CompanyDetailDto {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: string;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  activatedAt: string | null;
  serviceAreas: CompanyServiceAreaDto[];
  staffCount: number;
  createdAt: string;
}
