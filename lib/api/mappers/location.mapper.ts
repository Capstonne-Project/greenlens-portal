import type { ProvinceDto, WardDto } from '@/lib/api/dto/location.dto';
import type { Province, Ward } from '@/lib/api/models/location';

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
