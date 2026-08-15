import type {
  CompanyQueueItemDto,
  CompanyQueueListDto,
  CompanyQueueMediaDto,
} from '@/lib/api/dto/companyQueue.dto';
import type {
  CompanyQueueItem,
  CompanyQueueList,
  CompanyQueueMedia,
} from '@/lib/api/models/company';
import { normalizeMediaUrl } from '@/utils/reportThumbnail';

function mapMediaItem(dto: CompanyQueueMediaDto | null | undefined): CompanyQueueMedia | null {
  if (!dto || typeof dto !== 'object') return null;
  const url = normalizeMediaUrl(dto.url);
  if (!url) return null;
  return {
    id: typeof dto.id === 'string' && dto.id.trim() ? dto.id : `queue-media-${url}`,
    url,
    thumbnailUrl: normalizeMediaUrl(dto.thumbnailUrl),
    type: typeof dto.type === 'string' && dto.type.trim() ? dto.type : 'Image',
    uploadedAt: dto.uploadedAt ?? new Date(0).toISOString(),
  };
}

function mapQueueItem(dto: CompanyQueueItemDto): CompanyQueueItem {
  const media = (dto.media ?? [])
    .map(mapMediaItem)
    .filter((item): item is CompanyQueueMedia => item !== null);

  const first = media[0];
  const thumbnailUrl =
    (first?.thumbnailUrl ? normalizeMediaUrl(first.thumbnailUrl) : null) ??
    (first?.url ? normalizeMediaUrl(first.url) : null);

  return {
    reportId: dto.reportId,
    code: dto.code ?? '',
    address: dto.address ?? '',
    wardCode: dto.wardCode ?? '',
    provinceCode: dto.provinceCode ?? null,
    latitude: dto.latitude ?? 0,
    longitude: dto.longitude ?? 0,
    categoryName: dto.categoryName ?? '',
    severity: dto.severity,
    dispatchedAt: dto.dispatchedAt ?? '',
    verifiedAt: dto.verifiedAt ?? null,
    verifiedByName: dto.verifiedByName ?? null,
    slaResolveDueAt: dto.slaResolveDueAt ?? '',
    media,
    thumbnailUrl,
  };
}

export function mapCompanyQueueListDto(dto: CompanyQueueListDto): CompanyQueueList {
  return {
    items: (dto.items ?? []).map(mapQueueItem),
    pagination: dto.pagination,
  };
}
