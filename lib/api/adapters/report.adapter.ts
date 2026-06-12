import type {
  ReportDetailDto,
  ReportDetailResponseDto,
  ReportQueueItemDto,
  ReportQueueResponseDto,
} from '@/lib/api/dto/report.dto';
import type {
  ReportDetail,
  ReportQueueData,
  ReportQueueItem,
  ReportQueueParams,
} from '@/lib/api/models/report';
import apiService from '@/lib/api/core';
import { normalizeReportStatus } from '@/lib/constants/reportStatus';

function mapQueueItem(dto: ReportQueueItemDto): ReportQueueItem {
  return {
    ...dto,
    status: normalizeReportStatus(String(dto.status)),
  };
}

function mapReportDetail(dto: ReportDetailDto): ReportDetail {
  return {
    ...dto,
    status: normalizeReportStatus(String(dto.status)),
  };
}

export async function adaptFetchReportQueue(params: ReportQueueParams): Promise<ReportQueueData> {
  const res = await apiService.get<ReportQueueResponseDto>('/v1/reports/queue', {
    page: params.page,
    pageSize: params.pageSize,
  });
  const data = res.data.data;
  return {
    ...data,
    items: (data.items ?? []).map(mapQueueItem),
  };
}

export async function adaptFetchReportDetail(id: string): Promise<ReportDetail> {
  const res = await apiService.get<ReportDetailResponseDto>(`/v1/reports/${id}`);
  return mapReportDetail(res.data.data);
}
