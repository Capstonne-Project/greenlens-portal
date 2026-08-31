import Image from 'next/image';
import Link from 'next/link';
import { APP_LOGO_MARK_SRC, APP_NAME } from '@/lib/constants/brand';
import {
  ANDROID_APK_HREF,
  PUBLIC_SITE_FOOTER,
  PUBLIC_SITE_FOOTER_COMPANY_LINKS,
  PUBLIC_SITE_FOOTER_PRODUCT_LINKS,
  PUBLIC_SITE_FOOTER_RESOURCE_LINKS,
  PUBLIC_SITE_NAV,
  PUBLIC_SITE_SOCIAL_LINKS,
  type PublicSiteFooterLink,
} from '@/lib/constants/publicSite';

const apkExternal = /^https?:\/\//i.test(ANDROID_APK_HREF);

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: PublicSiteFooterLink[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-800/70 uppercase">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map(item => {
          const isApk = item.href === ANDROID_APK_HREF;
          const external = !isApk && (item.external ?? /^https?:\/\//i.test(item.href));
          const className =
            'text-sm text-slate-600 transition-colors hover:text-slate-900 focus-visible:text-slate-900 focus-visible:outline-none';

          if (external) {
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={className}
                  {...(isApk && !apkExternal
                    ? { download: true }
                    : external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                >
                  {item.label}
                </a>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <Link href={item.href} className={className}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function PublicSiteFooter() {
  const facebook = PUBLIC_SITE_SOCIAL_LINKS[0];

  return (
    <footer className="border-t border-black/5 bg-white text-slate-700">
      <div className="landing-shell py-12 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
            >
              <Image
                src={APP_LOGO_MARK_SRC}
                alt=""
                width={28}
                height={28}
                className="size-7 object-contain"
              />
              <span className="text-base font-semibold text-emerald-800">{APP_NAME}</span>
            </Link>
            <nav aria-label="Điều hướng chính" className="flex flex-col gap-3">
              {PUBLIC_SITE_NAV.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="text-sm font-semibold text-slate-900 transition-colors hover:text-emerald-700 focus-visible:text-emerald-700 focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {facebook ? (
              <a
                href={facebook.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={facebook.label}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-emerald-900/10 bg-slate-50 text-slate-600 transition-colors hover:border-emerald-900/20 hover:bg-slate-100 hover:text-emerald-800"
              >
                <FacebookIcon />
              </a>
            ) : null}
          </div>

          <FooterLinkColumn title="Sản phẩm" links={PUBLIC_SITE_FOOTER_PRODUCT_LINKS} />
          <FooterLinkColumn title="Tài nguyên" links={PUBLIC_SITE_FOOTER_RESOURCE_LINKS} />
          <FooterLinkColumn title="Dự án" links={PUBLIC_SITE_FOOTER_COMPANY_LINKS} />
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="landing-shell py-5">
          <p className="text-xs text-slate-500">{PUBLIC_SITE_FOOTER.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
