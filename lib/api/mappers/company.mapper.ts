import type {
  CompanyListItemDto,
  CompaniesListDataDto,
  CompanyDetailDto,
  CompanyServiceAreaDto,
  CompanyServiceAreasDataDto,
  CreateCompanyDataDto,
  MyWardCompaniesListDataDto,
  MyWardCompanyDetailDto,
  MyWardCompanyItemDto,
} from '@/lib/api/dto/company.dto';
import type {
  CompaniesList,
  CompanyDetail,
  CompanyListItem,
  CompanyServiceArea,
  CompanyServiceAreas,
  CreatedCompany,
  MyWardCompaniesList,
  MyWardCompanyDetail,
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
    contractStartDate: dto.contractStartDate,
    contractEndDate: dto.contractEndDate,
    taxCode: dto.taxCode,
    phone: dto.phone,
    email: dto.email,
    serviceAreaCount: dto.serviceAreaCount,
    staffCount: dto.staffCount,
    activeReportCount: dto.activeReportCount,
    createdAt: dto.createdAt,
  };
}

export function mapMyWardCompaniesListDataDto(dto: MyWardCompaniesListDataDto): MyWardCompaniesList {
  return {
    localOfficeId: dto.localOfficeId,
    localOfficeName: dto.localOfficeName,
    wardCode: dto.wardCode,
    wardName: dto.wardName,
    items: (dto.items ?? []).map(mapMyWardCompanyItemDto),
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

/** @deprecated Dùng `mapMyWardCompaniesListDataDto`. */
export function mapMyWardCompaniesDataDto(dto: MyWardCompaniesListDataDto): MyWardCompaniesList {
  return mapMyWardCompaniesListDataDto(dto);
}

export function mapMyWardCompanyDetailDto(dto: MyWardCompanyDetailDto): MyWardCompanyDetail {
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
    localOfficeId: dto.localOfficeId,
    localOfficeName: dto.localOfficeName,
    wardCode: dto.wardCode,
    wardName: dto.wardName,
    wardServiceArea: dto.wardServiceArea ? mapCompanyServiceAreaDto(dto.wardServiceArea) : null,
    allServiceAreas: (dto.allServiceAreas ?? []).map(mapCompanyServiceAreaDto),
    staffCount: dto.staffCount,
    teamCount: dto.teamCount,
    activeReportCount: dto.activeReportCount,
    completedReportCount: dto.completedReportCount,
    createdAt: dto.createdAt,
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
