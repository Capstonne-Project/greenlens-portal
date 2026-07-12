import type { GamificationConfigDto } from '@/lib/api/dto/gamificationConfig.dto';
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

export function mapGamificationConfigListDto(
  items: GamificationConfigDto[] | null | undefined
): GamificationConfig[] {
  return (items ?? []).map(mapGamificationConfigDto);
}
