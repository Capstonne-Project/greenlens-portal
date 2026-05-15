import type { ApiEnvelope, LoginSuccessData } from '@/lib/api/types/auth';
import axios from 'axios';
import { getApiBaseUrl } from './getApiBaseUrl';

/** POST /v1/auth/refresh-token — raw axios (no L1 interceptors → no 401 loop). */
export async function postRefreshToken(
  refreshToken: string
): Promise<ApiEnvelope<LoginSuccessData>> {
  const base = getApiBaseUrl();
  const res = await axios.post<ApiEnvelope<LoginSuccessData>>(
    `${base}/v1/auth/refresh-token`,
    { refreshToken },
    {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
    }
  );
  return res.data;
}
