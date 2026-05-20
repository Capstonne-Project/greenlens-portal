import type { ReportDetailResponseDto, ReportQueueResponseDto } from '@/lib/api/dto/report.dto';
import type { ReportDetail, ReportQueueData, ReportQueueParams } from '@/lib/api/models/report';
import apiService from '@/lib/api/core';

export async function adaptFetchReportQueue(params: ReportQueueParams): Promise<ReportQueueData> {
  const res = await apiService.get<ReportQueueResponseDto>('/v1/reports/queue', {
    page: params.page,
    pageSize: params.pageSize,
  });
  return res.data.data;
}

export async function adaptFetchReportDetail(id: string): Promise<ReportDetail> {
  const res = await apiService.get<ReportDetailResponseDto>(`/v1/reports/${id}`);
  return res.data.data;
}
