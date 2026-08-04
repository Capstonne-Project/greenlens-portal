'use client';

import { LoginFormMotion } from '@/components/auth/login-hero/LoginFormMotion';
import { LoginHeroScene } from '@/components/auth/login-hero/LoginHeroScene';
import { GreenLensLogo } from '@/components/auth/GreenLensLogo';
import '@/components/auth/login-hero/login-hero.css';
import Image from 'next/image';
import type { ReactNode } from 'react';

type AuthFormLayoutProps = {
  /** Gọi 2 lần (desktop + mobile) — mỗi lần phải là form/hook instance riêng (giống LoginFormCard). */
  renderPanel: () => ReactNode;
};

/** Cùng layout căn giữa với `/login` — desktop hero + mobile stack. */
export function AuthFormLayout({ renderPanel }: AuthFormLayoutProps) {
  return (
    <>
      <div className="relative hidden min-h-screen overflow-hidden lg:block">
        <LoginHeroScene />
        <div className="login-hero-center-slot">
          <LoginFormMotion className="w-full">{renderPanel()}</LoginFormMotion>
        </div>
      </div>

      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#eef2ea] lg:hidden">
        <aside className="relative w-full min-w-0">
          <div className="relative h-52 w-full sm:h-60">
            <Image
              src="/images/login-hero1.png"
              alt="Protect our Planet — hành động vì môi trường"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_38%]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a2e1f]/80 via-transparent to-black/15"
              aria-hidden
            />
            <div className="absolute inset-x-0 top-0 p-4 sm:p-5">
              <GreenLensLogo variant="onImage" className="text-2xl sm:text-3xl" />
            </div>
          </div>
        </aside>

        <div className="relative flex w-full min-w-0 flex-col justify-center px-4 pb-10 pt-6 sm:px-6">
          <div className="mx-auto w-full max-w-[400px]">{renderPanel()}</div>
        </div>
      </div>
    </>
  );
}
