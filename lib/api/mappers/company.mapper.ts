import type {
  CompanyListItemDto,
  CompaniesListDataDto,
  CompanyServiceAreasDataDto,
  CreateCompanyDataDto,
} from '@/lib/api/dto/company.dto';
import type {
  CompaniesList,
  CompanyListItem,
  CompanyServiceAreas,
  CreatedCompany,
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

export function mapCompanyServiceAreasDataDto(
  dto: CompanyServiceAreasDataDto
): CompanyServiceAreas {
  return {
    wardCodes: dto.wardCodes ?? [],
  };
}
