/** FE models — công ty DVMT (DEO/Admin). */

/** POST /v1/companies — `contractType` enum. */
export const COMPANY_CONTRACT_TYPES = ['Subsidiary', 'Bidding'] as const;

export type CompanyContractType = (typeof COMPANY_CONTRACT_TYPES)[number];

export type CompanyStatus = 'PendingActivation' | 'Active' | 'Suspended' | 'Expired' | string;

/** GET /v1/companies — item */
export interface CompanyListItem {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  phone: string;
  email: string;
  serviceAreaCount: number;
  staffCount: number;
  createdAt: string;
}

export interface CompanyPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CompaniesList {
  items: CompanyListItem[];
  pagination: CompanyPagination;
}

/** POST /v1/companies */
export interface CreateCompanyInput {
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
  managerEmail?: string;
  managerFullName?: string;
  wardCodes?: string[];
}

/** POST /v1/companies — 201 data */
export interface CreatedCompany {
  companyId: string;
  companyName: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  managerUserId: string;
  managerEmail: string;
  tempPassword: string;
}

export interface CompaniesListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export const COMPANIES_PAGE_SIZE = 10;

/** GET /v1/companies/my-ward — [LEO] công ty phục vụ phường/xã của LEO. */
export interface MyWardCompanyItem {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  phone: string;
  email: string;
  serviceAreaCount: number;
  staffCount: number;
}

export interface MyWardCompanies {
  companies: MyWardCompanyItem[];
}

/** GET /v1/companies/{id}/service-areas */
export interface CompanyServiceAreas {
  wardCodes: string[];
}

/** PUT /v1/companies/{id}/service-areas */
export interface UpdateCompanyServiceAreasInput {
  wardCodes: string[];
}

/** GET /v1/companies/{id} — địa bàn phụ trách (phường/xã). */
export interface CompanyServiceArea {
  id: string;
  wardCode: string;
  wardName: string;
  provinceCode: string;
}

/** GET /v1/companies/{id} — chi tiết công ty DVMT. */
export interface CompanyDetail {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  activatedAt: string | null;
  serviceAreas: CompanyServiceArea[];
  staffCount: number;
  createdAt: string;
}
