import { GreenLensLogo } from '@/components/auth/GreenLensLogo';
import { APP_LOGO_MARK_SRC, APP_NAME } from '@/lib/constants/brand';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Nội dung chuẩn theo docs/fe-facebook-sdk-share-dialog-guide.md §8.4
 * (chỉ Privacy Policy — không triển khai Facebook SDK).
 */
export const PRIVACY_POLICY_UPDATED_AT = '28/08/2026';
export const PRIVACY_CONTACT_EMAIL = 'hieutran4525@gmail.com';
export const PRIVACY_PROJECT_CODE = 'SU26SE049 - FPT University';

/** Palette bám Meta Privacy Center / facebook.com/privacy/policy */
const META = {
  text: '#080809',
  secondary: '#65676B',
  link: '#0866FF',
  border: '#CED0D4',
  hairline: '#E4E6EB',
  surface: '#F0F2F5',
  highlightBg: '#E7F3FF',
  highlightBorder: '#B6D0FF',
  white: '#FFFFFF',
  sideBg: '#F7F8FA',
} as const;

function resolvePortalBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WEB_BASE_URL?.trim().replace(/\/$/, '');
  return fromEnv || 'https://greenlens-portal.vercel.app';
}

/** TOC = đúng 13 mục §8.4 */
const TOC = [
  { id: 'privacy-intro', label: '1. Giới thiệu' },
  { id: 'privacy-scope', label: '2. Phạm vi áp dụng' },
  { id: 'privacy-collect', label: '3. Thông tin chúng tôi thu thập' },
  { id: 'privacy-purpose', label: '4. Mục đích sử dụng' },
  { id: 'privacy-public', label: '5. Trang công khai và chia sẻ' },
  { id: 'privacy-third-party', label: '6. Chia sẻ với bên thứ ba' },
  { id: 'privacy-security', label: '7. Lưu trữ và bảo mật' },
  { id: 'privacy-retention', label: '8. Thời gian lưu giữ' },
  { id: 'privacy-rights', label: '9. Quyền của bạn' },
  { id: 'data-deletion', label: '10. Xóa dữ liệu' },
  { id: 'privacy-children', label: '11. Trẻ em' },
  { id: 'privacy-changes', label: '12. Thay đổi chính sách' },
  { id: 'privacy-contact', label: '13. Liên hệ' },
] as const;

type PrivacyPolicyContentProps = {
  variant?: 'public' | 'embedded';
  className?: string;
};

function Highlights({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-5 rounded-[12px] border px-4 py-3.5 sm:px-5 sm:py-4"
      style={{
        backgroundColor: META.highlightBg,
        borderColor: META.highlightBorder,
      }}
    >
      <p className="text-[13px] font-bold leading-none" style={{ color: META.link }}>
        Highlights
      </p>
      <div className="mt-2.5 space-y-2 text-[15px] leading-[1.45]" style={{ color: META.text }}>
        {children}
      </div>
    </div>
  );
}

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-[72px] border-b py-8 sm:py-10"
      style={{ borderColor: META.hairline }}
    >
      <h2
        id={`${id}-heading`}
        className="text-[24px] font-bold leading-[1.2] tracking-tight sm:text-[28px]"
        style={{ color: META.text }}
      >
        {title}
      </h2>
      <div
        className={cn(
          'mt-4 space-y-3 text-[15px] leading-[1.55]',
          '[&_a]:font-semibold [&_a]:underline-offset-[3px] hover:[&_a]:underline',
          '[&_h3]:mt-6 [&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:leading-snug',
          '[&_li]:mt-1.5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_strong]:font-semibold [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5'
        )}
        style={{ color: META.text }}
      >
        {children}
      </div>
    </section>
  );
}

function MetaLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className="no-underline"
      style={{ color: META.link }}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

function PrivacyCenterShell({
  variant,
  children,
}: {
  variant: 'public' | 'embedded';
  children: ReactNode;
}) {
  if (variant === 'embedded') {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: META.white, color: META.text }}>
      {/* Top bar — Meta Privacy Center */}
      <header className="sticky top-0 z-50 border-b bg-white" style={{ borderColor: META.border }}>
        <div className="mx-auto flex h-[56px] max-w-[1220px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2 no-underline"
            aria-label={`${APP_NAME} — trang chủ`}
          >
            <Image
              src={APP_LOGO_MARK_SRC}
              alt=""
              width={32}
              height={32}
              priority
              className="size-8 shrink-0 object-contain"
              unoptimized
            />
            <GreenLensLogo className="text-lg sm:text-xl" />
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span
              className="rounded-md px-3 py-1.5 text-[14px] font-semibold"
              style={{ color: META.link, backgroundColor: META.highlightBg }}
            >
              Chính sách
            </span>
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-[14px] font-semibold no-underline transition hover:bg-black/[0.04]"
              style={{ color: META.text }}
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer
        className="border-t px-4 py-8 text-center text-[13px] sm:px-6"
        style={{ borderColor: META.border, color: META.secondary, backgroundColor: META.sideBg }}
      >
        <p>
          © {new Date().getFullYear()} {APP_NAME} · {PRIVACY_PROJECT_CODE}
        </p>
        <p className="mt-2">
          <MetaLink href="/privacy">Chính sách quyền riêng tư</MetaLink>
          <span className="mx-2">·</span>
          <MetaLink href="/login">Đăng nhập</MetaLink>
        </p>
      </footer>
    </div>
  );
}

/**
 * UI: Meta Privacy Center / facebook.com/privacy/policy
 * Nội dung: guide §8.4 (placeholders đã điền).
 */
export function PrivacyPolicyContent({ variant = 'public', className }: PrivacyPolicyContentProps) {
  const portalBase = resolvePortalBaseUrl();
  const communityExample = `${portalBase}/c/community/{eventId}`;
  const showToc = variant === 'public';

  return (
    <PrivacyCenterShell variant={variant}>
      <div
        className={cn(
          'mx-auto grid max-w-[1220px]',
          showToc && 'lg:grid-cols-[280px_minmax(0,1fr)]',
          className
        )}
      >
        {/* Left rail — public /privacy only */}
        {showToc ? (
          <aside
            className="hidden border-r lg:block"
            style={{ borderColor: META.hairline, backgroundColor: META.sideBg }}
          >
            <nav
              aria-label="Mục lục chính sách"
              className="sticky top-[56px] max-h-[calc(100vh-56px)] overflow-y-auto px-3 py-5"
            >
              <p
                className="mb-2 px-3 text-[12px] font-bold tracking-[0.04em] uppercase"
                style={{ color: META.secondary }}
              >
                Privacy Policy
              </p>
              <ul className="space-y-0.5">
                {TOC.map(item => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-2 text-[14px] font-medium leading-snug no-underline transition hover:bg-black/[0.04]"
                      style={{ color: META.text }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div
                className="mt-6 border-t px-3 pt-4 text-[12px] leading-relaxed"
                style={{ borderColor: META.border, color: META.secondary }}
              >
                Meta yêu cầu URL công khai này khi bật app Live. Trang không cần đăng nhập.
              </div>
            </nav>
          </aside>
        ) : null}

        {/* Main column */}
        <div
          className={cn(
            'min-w-0 bg-white',
            variant === 'public' ? 'px-4 py-6 sm:px-8 sm:py-8 lg:px-10' : 'px-4 py-5 sm:px-6'
          )}
        >
          <header>
            <p
              className="text-[13px] font-semibold tracking-[0.02em] uppercase"
              style={{ color: META.secondary }}
            >
              Privacy Policy
            </p>
            <h1
              className="mt-1 text-[32px] font-bold leading-[1.15] tracking-tight sm:text-[40px]"
              style={{ color: META.text }}
            >
              Chính sách quyền riêng tư — {APP_NAME}
            </h1>
            <p className="mt-3 text-[15px]" style={{ color: META.secondary }}>
              Cập nhật lần cuối:{' '}
              <span className="font-semibold" style={{ color: META.text }}>
                {PRIVACY_POLICY_UPDATED_AT}
              </span>
              <span className="mx-2" aria-hidden>
                |
              </span>
              Có hiệu lực từ {PRIVACY_POLICY_UPDATED_AT}
            </p>
          </header>

          {/* Update banner — Meta style */}
          <div
            className="mt-6 rounded-[12px] border px-4 py-4 sm:px-5"
            style={{
              backgroundColor: META.highlightBg,
              borderColor: META.highlightBorder,
            }}
          >
            <p className="text-[15px] font-bold" style={{ color: META.text }}>
              Chúng tôi đã cập nhật Chính sách quyền riêng tư
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.45]" style={{ color: META.secondary }}>
              Bản này mô tả cách {APP_NAME} xử lý thông tin khi bạn dùng cổng web và khi chia sẻ
              liên kết công khai (kể cả qua Facebook Share Dialog).
            </p>
            <a
              href="#privacy-intro"
              className="mt-3 inline-block text-[14px] font-bold no-underline"
              style={{ color: META.link }}
            >
              Xem chi tiết
            </a>
          </div>

          {/* Mobile TOC — public /privacy only */}
          {showToc ? (
            <details
              className="mt-5 rounded-[12px] border lg:hidden"
              style={{ borderColor: META.border, backgroundColor: META.surface }}
            >
              <summary
                className="cursor-pointer px-4 py-3 text-[14px] font-bold"
                style={{ color: META.text }}
              >
                Mục lục chính sách
              </summary>
              <ul className="space-y-0.5 border-t px-2 py-2" style={{ borderColor: META.border }}>
                {TOC.map(item => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-2 text-[14px] font-medium no-underline"
                      style={{ color: META.link }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/* ===== §8.4 body ===== */}

          <PolicySection id="privacy-intro" title="1. Giới thiệu">
            <Highlights>
              <p>
                Chúng tôi muốn bạn hiểu thông tin nào được thu thập và cách sử dụng. Đọc chính sách
                này giúp bạn dùng {APP_NAME} theo cách phù hợp với bạn.
              </p>
            </Highlights>
            <p>
              {APP_NAME} (“Chúng tôi”) là cổng web dành cho cán bộ môi trường địa phương (LEO) trong
              hệ sinh thái ứng dụng <strong>{APP_NAME}</strong> — nền tảng báo cáo và theo dõi ô
              nhiễm môi trường (dự án {PRIVACY_PROJECT_CODE}).
            </p>
            <p>
              Chính sách này mô tả cách chúng tôi xử lý thông tin khi bạn truy cập {APP_NAME} tại:
            </p>
            <p>
              <MetaLink href={portalBase}>{portalBase}</MetaLink>
            </p>
          </PolicySection>

          <PolicySection id="privacy-scope" title="2. Phạm vi áp dụng">
            <ul>
              <li>
                Áp dụng cho <strong>{APP_NAME} (web LEO)</strong>.
              </li>
              <li>
                <strong>Không</strong> thay thế chính sách của ứng dụng di động {APP_NAME} dành cho
                công dân (nếu được công bố riêng).
              </li>
              <li>
                Trang công khai chia sẻ chương trình dọn dẹp (
                <code
                  className="rounded px-1 text-[13px]"
                  style={{ backgroundColor: META.surface }}
                >
                  /c/community/...
                </code>
                ) nằm trên cùng domain; mục 5 mô tả dữ liệu hiển thị trên các trang đó.
              </li>
            </ul>
          </PolicySection>

          <PolicySection id="privacy-collect" title="3. Thông tin chúng tôi thu thập">
            <Highlights>
              <p>
                Thông tin thu thập phụ thuộc vào cách bạn dùng {APP_NAME}. Khi đăng nhập, chúng tôi
                xử lý thông tin tài khoản và dữ liệu nghiệp vụ bạn tạo.
              </p>
            </Highlights>

            <h3>3.1 Thông tin bạn cung cấp</h3>
            <ul>
              <li>Họ tên, email, số điện thoại (khi đăng ký / quản trị tài khoản LEO).</li>
              <li>
                Nội dung nghiệp vụ: báo cáo môi trường, chương trình dọn dẹp cộng đồng, ghi chú công
                việc.
              </li>
            </ul>

            <h3>3.2 Thông tin thu thập tự động</h3>
            <ul>
              <li>
                Token phiên đăng nhập (JWT) lưu phía trình duyệt theo cơ chế bảo mật của ứng dụng.
              </li>
              <li>
                Nhật ký kỹ thuật: thời gian truy cập, loại trình duyệt, mã lỗi (không cố ý ghi mật
                khẩu).
              </li>
            </ul>

            <h3>3.3 Thông tin từ Meta (Facebook)</h3>
            <p>
              {APP_NAME} <strong>có thể</strong> tích hợp{' '}
              <strong>Facebook JavaScript SDK Share Dialog</strong> để bạn <strong>chủ động</strong>{' '}
              chia sẻ liên kết công khai lên Facebook.
            </p>
            <ul>
              <li>
                Chúng tôi <strong>không</strong> sử dụng <strong>Facebook Login</strong> —{' '}
                {APP_NAME} <strong>không</strong> yêu cầu bạn đăng nhập {APP_NAME} bằng tài khoản
                Facebook.
              </li>
              <li>
                Chúng tôi <strong>không</strong> nhận hoặc lưu trữ dữ liệu cá nhân Facebook (tên FB,
                friend list, email FB, v.v.) từ SDK.
              </li>
              <li>
                Việc đăng bài lên Facebook do <strong>bạn</strong> xác nhận trong giao diện của
                Facebook; chúng tôi <strong>không</strong> đăng bài tự động thay bạn.
              </li>
            </ul>
            <p>
              Meta có thể thu thập dữ liệu riêng theo{' '}
              <MetaLink href="https://www.facebook.com/privacy/policy/" external>
                Chính sách dữ liệu của Meta
              </MetaLink>
              . Chúng tôi không kiểm soát cách Meta xử lý dữ liệu trên nền tảng của họ.
            </p>
          </PolicySection>

          <PolicySection id="privacy-purpose" title="4. Mục đích sử dụng">
            <ul>
              <li>Xác thực và phân quyền tài khoản LEO.</li>
              <li>Quản lý vòng đời báo cáo ô nhiễm và chương trình dọn dẹp cộng đồng.</li>
              <li>Gửi thông báo nghiệp vụ (nếu bạn bật).</li>
              <li>Cải thiện độ ổn định và bảo mật hệ thống.</li>
            </ul>
            <p>
              Chúng tôi <strong>không</strong> bán dữ liệu cá nhân cho bên thứ ba.
            </p>
          </PolicySection>

          <PolicySection id="privacy-public" title="5. Trang công khai và chia sẻ mạng xã hội">
            <p>
              Khi LEO chia sẻ chương trình dọn dẹp, người xem link (kể cả qua Facebook) có thể thấy
              trang công khai, ví dụ:
            </p>
            <p
              className="break-all rounded-[12px] px-4 py-3 font-mono text-[13px]"
              style={{ backgroundColor: META.surface, color: META.secondary }}
            >
              {communityExample}
            </p>
            <p>Trang này có thể hiển thị:</p>
            <ul>
              <li>Tiêu đề và mô tả chương trình.</li>
              <li>Thời gian, địa điểm tổng quát (cấp phường/quận).</li>
              <li>Ảnh minh họa (thumbnail).</li>
              <li>
                Số lượng người tham gia (số đếm, <strong>không</strong> danh sách tên công khai).
              </li>
            </ul>
            <p>
              Chúng tôi <strong>không</strong> công bố email, số điện thoại hay danh sách
              participant trên trang công khai này.
            </p>
          </PolicySection>

          <PolicySection id="privacy-third-party" title="6. Chia sẻ với bên thứ ba">
            <p>Chúng tôi có thể sử dụng:</p>
            <div
              className="overflow-hidden rounded-[12px] border"
              style={{ borderColor: META.border }}
            >
              <table className="w-full text-left text-[14px]">
                <thead style={{ backgroundColor: META.surface }}>
                  <tr>
                    <th className="px-4 py-3 font-bold" style={{ color: META.text }}>
                      Bên
                    </th>
                    <th className="px-4 py-3 font-bold" style={{ color: META.text }}>
                      Mục đích
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t" style={{ borderColor: META.hairline }}>
                    <td className="px-4 py-3 font-semibold">Vercel</td>
                    <td className="px-4 py-3" style={{ color: META.secondary }}>
                      Hosting website
                    </td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: META.hairline }}>
                    <td className="px-4 py-3 font-semibold">Meta</td>
                    <td className="px-4 py-3" style={{ color: META.secondary }}>
                      SDK Share Dialog (tuỳ chọn trên giao diện)
                    </td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: META.hairline }}>
                    <td className="px-4 py-3 font-semibold">Nhà cung cấp hạ tầng</td>
                    <td className="px-4 py-3" style={{ color: META.secondary }}>
                      API, lưu trữ ảnh — vận hành backend {APP_NAME}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Các bên này chỉ xử lý dữ liệu trong phạm vi cung cấp dịch vụ cho chúng tôi.</p>
          </PolicySection>

          <PolicySection id="privacy-security" title="7. Lưu trữ và bảo mật">
            <ul>
              <li>Kết nối HTTPS giữa trình duyệt và {APP_NAME}.</li>
              <li>
                Mật khẩu được băm phía server (bcrypt); chúng tôi không lưu mật khẩu dạng văn bản
                thuần.
              </li>
              <li>Phiên đăng nhập có thời hạn; refresh token được bảo vệ theo thiết kế backend.</li>
            </ul>
            <p>
              Không có biện pháp bảo mật nào an toàn tuyệt đối 100%; chúng tôi nỗ lực giảm thiểu rủi
              ro hợp lý.
            </p>
          </PolicySection>

          <PolicySection id="privacy-retention" title="8. Thời gian lưu giữ">
            <ul>
              <li>
                Dữ liệu tài khoản: trong thời gian bạn sử dụng dịch vụ và theo quy định nội bộ / yêu
                cầu pháp luật.
              </li>
              <li>
                Tài khoản xóa mềm: có thể được xóa vĩnh viễn sau thời gian grace period theo chính
                sách hệ thống {APP_NAME}.
              </li>
              <li>Log kỹ thuật: lưu trong thời hạn hạn chế phục vụ vận hành và audit.</li>
            </ul>
          </PolicySection>

          <PolicySection id="privacy-rights" title="9. Quyền của bạn">
            <p>Tùy vai trò và quy định nội bộ, bạn có thể:</p>
            <ul>
              <li>Yêu cầu truy cập / chỉnh sửa thông tin tài khoản.</li>
              <li>
                Yêu cầu xóa tài khoản qua quy trình trong ứng dụng hoặc liên hệ email bên dưới.
              </li>
              <li>Ngừng sử dụng {APP_NAME} và thu hồi cookie/token bằng cách đăng xuất.</li>
            </ul>
          </PolicySection>

          <PolicySection id="data-deletion" title="10. Xóa dữ liệu">
            <Highlights>
              <p>
                Anchor <code className="text-[13px]">#data-deletion</code> dùng cho Meta User data
                deletion instructions URL.
              </p>
            </Highlights>
            <p>
              Nếu bạn muốn <strong>xóa dữ liệu tài khoản LEO</strong> hoặc yêu cầu xóa thông tin
              liên quan:
            </p>
            <ol>
              <li>
                Gửi email tới{' '}
                <MetaLink href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                  {PRIVACY_CONTACT_EMAIL}
                </MetaLink>{' '}
                với tiêu đề: <em>Yêu cầu xóa dữ liệu {APP_NAME}</em>.
              </li>
              <li>Ghi rõ email đăng ký tài khoản và mô tả yêu cầu.</li>
              <li>
                Chúng tôi phản hồi trong vòng <strong>30 ngày làm việc</strong> (dự án học thuật /
                capstone).
              </li>
            </ol>
            <p>
              <strong>Dữ liệu Facebook:</strong> Vì chúng tôi không lưu dữ liệu Facebook qua SDK,
              mọi bài đăng bạn tự chia sẻ trên Facebook do bạn quản lý trực tiếp trên tài khoản
              Facebook của mình.
            </p>
          </PolicySection>

          <PolicySection id="privacy-children" title="11. Trẻ em">
            <p>
              {APP_NAME} dành cho cán bộ / người dùng đủ năng lực hành vi dân sự theo quy định pháp
              luật Việt Nam; không hướng tới trẻ em dưới 16 tuổi.
            </p>
          </PolicySection>

          <PolicySection id="privacy-changes" title="12. Thay đổi chính sách">
            <p>
              Chúng tôi có thể cập nhật chính sách này. Phiên bản mới có ngày “Cập nhật lần cuối” ở
              đầu trang. Việc tiếp tục sử dụng {APP_NAME} sau khi cập nhật được hiểu là bạn đã biết
              đến thay đổi.
            </p>
          </PolicySection>

          <PolicySection id="privacy-contact" title="13. Liên hệ">
            <div
              className="rounded-[12px] border px-4 py-4 sm:px-5"
              style={{ borderColor: META.border, backgroundColor: META.surface }}
            >
              <ul className="!mt-0 space-y-2 !list-none !pl-0">
                <li>
                  <strong>Email:</strong>{' '}
                  <MetaLink href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                    {PRIVACY_CONTACT_EMAIL}
                  </MetaLink>
                </li>
                <li>
                  <strong>Dự án:</strong> {APP_NAME} — SU26SE049
                </li>
                <li>
                  <strong>Website:</strong> <MetaLink href={portalBase}>{portalBase}</MetaLink>
                </li>
              </ul>
            </div>
          </PolicySection>
        </div>
      </div>
    </PrivacyCenterShell>
  );
}
