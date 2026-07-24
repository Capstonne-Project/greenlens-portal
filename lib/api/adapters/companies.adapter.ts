import type {
  CompaniesListDataDto,
  CompanyDetailDto,
  CompanyServiceAreasDataDto,
  CreateCompanyBodyDto,
  CreateCompanyDataDto,
  MyWardCompaniesDataDto,
  RenewCompanyContractBodyDto,
  RenewCompanyContractDataDto,
  SuspendCompanyBodyDto,
  UpdateCompanyServiceAreasBodyDto,
} from '@/lib/api/dto/company.dto';
import {
  mapCompaniesListDataDto,
  mapCompanyDetailDto,
  mapCompanyServiceAreasDataDto,
  mapCreateCompanyDataDto,
  mapMyWardCompaniesDataDto,
} from '@/lib/api/mappers/company.mapper';
import type {
  CompaniesList,
  CompaniesListParams,
  CompanyContractHistory,
  CompanyDetail,
  CompanyServiceAreas,
  CreateCompanyInput,
  CreatedCompany,
  RenewCompanyContractInput,
  RenewCompanyContractResult,
  SuspendCompanyInput,
  UpdateCompanyServiceAreasInput,
  MyWardCompanies,
} from '@/lib/api/models/company';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildCompaniesQuery(
  params?: CompaniesListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.status?.trim()) query.status = params.status.trim();
  if (params?.sortBy?.trim()) query.sortBy = params.sortBy.trim();
  if (params?.sortDesc !== undefined) query.sortDesc = params.sortDesc;
  return query;
}

/** GET /v1/companies — [DEO/Admin] danh sách công ty DVMT. */
export async function adaptCompaniesList(
  params?: CompaniesListParams
): Promise<ApiEnvelope<CompaniesList>> {
  const res = await apiService.get<ApiEnvelope<CompaniesListDataDto>>(
    '/v1/companies',
    buildCompaniesQuery(params)
  );
  return mapApiEnvelope(res.data, mapCompaniesListDataDto);
}

/** GET /v1/companies/my-ward — [LEO] công ty phục vụ phường/xã của LEO (không params). */
export async function adaptMyWardCompanies(): Promise<ApiEnvelope<MyWardCompanies>> {
  const res = await apiService.get<ApiEnvelope<MyWardCompaniesDataDto>>('/v1/companies/my-ward');
  return mapApiEnvelope(res.data, mapMyWardCompaniesDataDto);
}

function buildCreateCompanyBody(body: CreateCompanyInput): CreateCompanyBodyDto {
  const payload: CreateCompanyBodyDto = {
    name: body.name.trim(),
    departmentId: body.departmentId,
    contractNumber: body.contractNumber.trim(),
    contractStartDate: body.contractStartDate,
    contractEndDate: body.contractEndDate,
    contractType: body.contractType,
    taxCode: body.taxCode.trim(),
    address: body.address.trim(),
    phone: body.phone.trim(),
    email: body.email.trim(),
  };

  const managerEmail = body.managerEmail?.trim();
  const managerFullName = body.managerFullName?.trim();
  if (managerEmail) payload.managerEmail = managerEmail;
  if (managerFullName) payload.managerFullName = managerFullName;
  if (body.wardCodes?.length) payload.wardCodes = body.wardCodes;

  return payload;
}

/** POST /v1/companies — [DEO/Admin] tạo công ty DVMT + tài khoản CM. */
export async function adaptCreateCompany(
  body: CreateCompanyInput
): Promise<ApiEnvelope<CreatedCompany>> {
  const payload = buildCreateCompanyBody(body);
  const res = await apiService.post<ApiEnvelope<CreateCompanyDataDto>>('/v1/companies', payload);
  return mapApiEnvelope(res.data, mapCreateCompanyDataDto);
}

/** GET /v1/companies/{id} — [DEO/Admin] chi tiết công ty DVMT. */
export async function adaptCompanyDetail(companyId: string): Promise<ApiEnvelope<CompanyDetail>> {
  const res = await apiService.get<ApiEnvelope<CompanyDetailDto>>(`/v1/companies/${companyId}`);
  return mapApiEnvelope(res.data, mapCompanyDetailDto);
}

/** GET /v1/companies/{id}/service-areas — [DEO/Admin] danh sách phường phụ trách. */
export async function adaptFetchCompanyServiceAreas(
  companyId: string
): Promise<ApiEnvelope<CompanyServiceAreas>> {
  const res = await apiService.get<ApiEnvelope<CompanyServiceAreasDataDto>>(
    `/v1/companies/${companyId}/service-areas`
  );
  return mapApiEnvelope(res.data, mapCompanyServiceAreasDataDto);
}

/** PUT /v1/companies/{id}/service-areas — [DEO/Admin] thay thế toàn bộ địa bàn phụ trách. */
export async function adaptUpdateCompanyServiceAreas(
  companyId: string,
  body: UpdateCompanyServiceAreasInput
): Promise<void> {
  const payload: UpdateCompanyServiceAreasBodyDto = {
    wardCodes: body.wardCodes,
  };
  await apiService.put(`/v1/companies/${companyId}/service-areas`, payload);
}

/** DELETE /v1/companies/{id} — [DEO/Admin] soft delete (vô hiệu hóa công ty). */
export async function adaptDeleteCompany(id: string): Promise<void> {
  await apiService.delete(`/v1/companies/${encodeURIComponent(id)}`);
}

/** POST /v1/companies/{id}/suspend — [DEO/Admin] tạm ngưng công ty (Active → Suspended). */
export async function adaptSuspendCompany(
  id: string,
  body: SuspendCompanyInput
): Promise<ApiEnvelope<string | null>> {
  const payload: SuspendCompanyBodyDto = { reason: body.reason.trim() };
  const res = await apiService.post<ApiEnvelope<string | null>>(
    `/v1/companies/${encodeURIComponent(id)}/suspend`,
    payload
  );
  return res.data;
}

/** POST /v1/companies/{id}/reactivate — [DEO/Admin] kích hoạt lại (Suspended → Active). */
export async function adaptReactivateCompany(id: string): Promise<ApiEnvelope<string | null>> {
  const res = await apiService.post<ApiEnvelope<string | null>>(
    `/v1/companies/${encodeURIComponent(id)}/reactivate`
  );
  return res.data;
}

/** POST /v1/companies/{id}/renew-contract — [DEO/Admin] gia hạn HĐ Bidding. */
export async function adaptRenewCompanyContract(
  id: string,
  body: RenewCompanyContractInput
): Promise<ApiEnvelope<RenewCompanyContractResult>> {
  const payload: RenewCompanyContractBodyDto = {
    newStartDate: body.newStartDate,
    newEndDate: body.newEndDate,
    newContractNumber: body.newContractNumber.trim(),
    note: body.note.trim(),
  };
  const res = await apiService.post<ApiEnvelope<RenewCompanyContractDataDto>>(
    `/v1/companies/${encodeURIComponent(id)}/renew-contract`,
    payload
  );
  return mapApiEnvelope(res.data, data => ({
    contractPeriodId: data.contractPeriodId,
    companyStatus: data.companyStatus,
  }));
}

/** GET /v1/companies/{id}/contract-history — [DEO/Admin] lịch sử kỳ hợp đồng (mới nhất trước). */
export async function adaptCompanyContractHistory(
  companyId: string
): Promise<ApiEnvelope<CompanyContractHistory>> {
  const res = await apiService.get<ApiEnvelope<CompanyContractHistory>>(
    `/v1/companies/${encodeURIComponent(companyId)}/contract-history`
  );
  return res.data;
}
