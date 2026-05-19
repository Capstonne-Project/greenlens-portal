/** Envelope chuẩn từ BE — chỉ dùng trong L2 (adapter/service), không leak raw shape ra L6. */
export interface ApiEnvelope<T> {
  code: string;
  message: string;
  status: number;
  data: T;
}

export function mapApiEnvelope<TIn, TOut>(
  envelope: ApiEnvelope<TIn>,
  mapData: (data: TIn) => TOut
): ApiEnvelope<TOut> {
  return {
    code: envelope.code,
    message: envelope.message,
    status: envelope.status,
    data: mapData(envelope.data),
  };
}
