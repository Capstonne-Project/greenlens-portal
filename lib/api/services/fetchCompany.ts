/**
 * L2 — Companies (công ty DVMT).
 */
import {
  adaptCompaniesList,
  adaptCreateCompany,
  adaptFetchCompanyServiceAreas,
  adaptUpdateCompanyServiceAreas,
} from '@/lib/api/adapters/companies.adapter';
import type {
  CompaniesList,
  CompaniesListParams,
  CompanyServiceAreas,
  CreateCompanyInput,
  CreatedCompany,
  UpdateCompanyServiceAreasInput,
} from '@/lib/api/models/company';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CompaniesList,
  CompaniesListParams,
  CompanyContractType,
  COMPANY_CONTRACT_TYPES,
  CompanyListItem,
  CompanyPagination,
  CompanyStatus,
  COMPANIES_PAGE_SIZE,
  CompanyServiceAreas,
  CreateCompanyInput,
  CreatedCompany,
  UpdateCompanyServiceAreasInput,
} from '@/lib/api/models/company';

/** GET /v1/companies — danh sách công ty DVMT (phân trang, tìm kiếm). */
export async function fetchCompanies(
  params?: CompaniesListParams
): Promise<ApiEnvelope<CompaniesList>> {
  return adaptCompaniesList(params);
}

/** POST /v1/companies — tạo công ty DVMT + tài khoản CM. */
export async function createCompany(
  body: CreateCompanyInput
): Promise<ApiEnvelope<CreatedCompany>> {
  return adaptCreateCompany(body);
}

/** GET /v1/companies/{id}/service-areas — danh sách phường phụ trách. */
export async function fetchCompanyServiceAreas(
  companyId: string
): Promise<ApiEnvelope<CompanyServiceAreas>> {
  return adaptFetchCompanyServiceAreas(companyId);
}

/** PUT /v1/companies/{id}/service-areas — cập nhật địa bàn phụ trách (thay thế toàn bộ). */
export async function updateCompanyServiceAreas(
  companyId: string,
  body: UpdateCompanyServiceAreasInput
): Promise<void> {
  return adaptUpdateCompanyServiceAreas(companyId, body);
}

const companyApi = {
  fetchCompanies,
  createCompany,
  fetchCompanyServiceAreas,
  updateCompanyServiceAreas,
};

export default companyApi;
