import type {
  CompanyListItemDto,
  CompaniesListDataDto,
  CompanyDetailDto,
  CompanyServiceAreaDto,
  CompanyServiceAreasDataDto,
  CreateCompanyDataDto,
  MyWardCompaniesDataDto,
  MyWardCompanyItemDto,
} from '@/lib/api/dto/company.dto';
import type {
  CompaniesList,
  CompanyDetail,
  CompanyListItem,
  CompanyServiceArea,
  CompanyServiceAreas,
  CreatedCompany,
  MyWardCompanies,
  MyWardCompanyItem,
} from '@/lib/api/models/company';

export function mapCreateCompanyDataDto(dto: CreateCompanyDataDto): CreatedCompany {
  return {
    companyId: dto.companyId,
    companyName: dto.companyName,
    contractNumber: dto.contractNumber,
    contractType: dto.contractType,
    status: dto.status,
    managerUserId: dto.managerUserId,
    managerEmail: dto.managerEmail,
    tempPassword: dto.tempPassword,
  };
}

export function mapCompanyListItemDto(dto: CompanyListItemDto): CompanyListItem {
  return {
    id: dto.id,
    name: dto.name,
    contractNumber: dto.contractNumber,
    contractType: dto.contractType,
    status: dto.status,
    contractStartDate: dto.contractStartDate,
    contractEndDate: dto.contractEndDate,
    taxCode: dto.taxCode,
    phone: dto.phone,
    email: dto.email,
    serviceAreaCount: dto.serviceAreaCount,
    staffCount: dto.staffCount,
    createdAt: dto.createdAt,
  };
}

export function mapCompaniesListDataDto(dto: CompaniesListDataDto): CompaniesList {
  return {
    items: dto.items.map(mapCompanyListItemDto),
    pagination: {
      page: dto.pagination.page,
      pageSize: dto.pagination.pageSize,
      totalItems: dto.pagination.totalItems,
      totalPages: dto.pagination.totalPages,
      hasNext: dto.pagination.hasNext,
      hasPrev: dto.pagination.hasPrev,
    },
  };
}

export function mapMyWardCompanyItemDto(dto: MyWardCompanyItemDto): MyWardCompanyItem {
  return {
    id: dto.id,
    name: dto.name,
    contractNumber: dto.contractNumber,
    contractType: dto.contractType,
    status: dto.status,
    phone: dto.phone,
    email: dto.email,
    serviceAreaCount: dto.serviceAreaCount,
    staffCount: dto.staffCount,
  };
}

export function mapMyWardCompaniesDataDto(dto: MyWardCompaniesDataDto): MyWardCompanies {
  return {
    companies: (dto.companies ?? []).map(mapMyWardCompanyItemDto),
  };
}

export function mapCompanyServiceAreasDataDto(
  dto: CompanyServiceAreasDataDto
): CompanyServiceAreas {
  return {
    wardCodes: dto.wardCodes ?? [],
  };
}

function mapCompanyServiceAreaDto(dto: CompanyServiceAreaDto): CompanyServiceArea {
  return {
    id: dto.id,
    wardCode: dto.wardCode,
    wardName: dto.wardName,
    provinceCode: dto.provinceCode,
  };
}

export function mapCompanyDetailDto(dto: CompanyDetailDto): CompanyDetail {
  return {
    id: dto.id,
    name: dto.name,
    contractNumber: dto.contractNumber,
    contractType: dto.contractType,
    status: dto.status,
    contractStartDate: dto.contractStartDate,
    contractEndDate: dto.contractEndDate,
    taxCode: dto.taxCode,
    address: dto.address,
    phone: dto.phone,
    email: dto.email,
    departmentId: dto.departmentId,
    departmentName: dto.departmentName,
    activatedAt: dto.activatedAt,
    serviceAreas: (dto.serviceAreas ?? []).map(mapCompanyServiceAreaDto),
    staffCount: dto.staffCount,
    createdAt: dto.createdAt,
  };
}
