import { NextResponse } from 'next/server';

/**
 * Whitelist domain CDN chứa file boundary — chặn SSRF/open-proxy, chỉ cho phép proxy tới
 * đúng nguồn dữ liệu ranh giới đã biết trước, không cho fetch URL tuỳ ý.
 */
const ALLOWED_BOUNDARY_HOSTS = ['d3iova6424vljy.cloudfront.net'];

/**
 * GET /api/ward-boundary?url=... — proxy fetch file GeoJSON ranh giới từ CDN.
 * Cần vì CloudFront không set CORS header cho phép browser fetch trực tiếp; server-side fetch
 * (route này) không bị CORS chi phối.
 */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) {
    return NextResponse.json(
      { code: 'MISSING_URL', status: false, message: 'Thiếu query param url.', data: null },
      { status: 400 }
    );
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json(
      { code: 'INVALID_URL', status: false, message: 'url không hợp lệ.', data: null },
      { status: 400 }
    );
  }

  if (target.protocol !== 'https:' || !ALLOWED_BOUNDARY_HOSTS.includes(target.hostname)) {
    return NextResponse.json(
      { code: 'HOST_NOT_ALLOWED', status: false, message: 'Domain không được phép.', data: null },
      { status: 403 }
    );
  }

  const upstream = await fetch(target, { next: { revalidate: 3600 } });
  if (!upstream.ok) {
    return NextResponse.json(
      {
        code: 'UPSTREAM_ERROR',
        status: false,
        message: `CDN trả lỗi ${upstream.status}.`,
        data: null,
      },
      { status: 502 }
    );
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
