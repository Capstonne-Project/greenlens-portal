import type { ProvinceDto, WardBoundaryDto, WardDto } from '@/lib/api/dto/location.dto';
import type { Province, Ward, WardBoundary } from '@/lib/api/models/location';

export function mapProvinceDto(dto: ProvinceDto): Province {
  return {
    code: dto.code.trim(),
    name: dto.name,
    boundaryUrl: dto.boundaryUrl ?? null,
  };
}

export function mapWardDto(dto: WardDto): Ward {
  return {
    code: dto.code.trim(),
    name: dto.name,
    unitAbbreviation: dto.unitAbbreviation ?? null,
    boundaryUrl: dto.boundaryUrl ?? null,
  };
}

export function mapWardBoundaryDto(dto: WardBoundaryDto): WardBoundary {
  return {
    wardCode: dto.wardCode.trim(),
    boundaryUrl: dto.boundaryUrl ?? null,
  };
}
