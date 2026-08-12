import type {
  GamificationConfigDto,
  GamificationConfigListDataDto,
} from '@/lib/api/dto/gamificationConfig.dto';
import type { GamificationConfig } from '@/lib/api/models/gamificationConfig';

export function mapGamificationConfigDto(dto: GamificationConfigDto): GamificationConfig {
  return {
    id: dto.id,
    actionType: dto.actionType,
    points: dto.points ?? 0,
    description: dto.description?.trim() || '',
    isActive: Boolean(dto.isActive),
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

/** Hỗ trợ BE mới `{ items }` và legacy mảng trực tiếp. */
export function mapGamificationConfigListDataDto(
  data: GamificationConfigListDataDto | GamificationConfigDto[] | null | undefined
): GamificationConfig[] {
  if (Array.isArray(data)) {
    return data.map(mapGamificationConfigDto);
  }
  const items = data?.items;
  return Array.isArray(items) ? items.map(mapGamificationConfigDto) : [];
}
