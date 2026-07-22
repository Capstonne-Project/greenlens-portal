'use client';

import { cn } from '@/lib/utils';
import Link, { type LinkProps } from 'next/link';
import React, { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

type Links = {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
};

type SidebarContextProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  /** When true, desktop sidebar stays expanded (e.g. profile menu open). */
  hoverLocked: boolean;
  setHoverLocked: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) {
  const [openState, setOpenState] = useState(false);
  const [hoverLocked, setHoverLocked] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, hoverLocked, setHoverLocked }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
}

export function SidebarBody(props: React.ComponentProps<typeof motion.div>) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
}

export function DesktopSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const { open, setOpen, animate, hoverLocked } = useSidebar();
  return (
    <motion.div
      data-sidebar-desktop=""
      className={cn(
        // overflow-x clips labels during width tween; overflow-y scrolls long nav.
        // Keep clip at the full sidebar box (incl. padding) so collapsed selected chips aren't cut.
        'hidden h-full w-[60px] shrink-0 overflow-hidden bg-[#f7f7f7] px-4 py-4 md:flex md:flex-col',
        className
      )}
      animate={{
        width: animate ? (open ? '220px' : '60px') : '220px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        // Keep expanded while a flyout (profile menu) is open — menu sits outside the sidebar.
        if (!hoverLocked) setOpen(false);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MobileSidebar({ className, children, ...props }: React.ComponentProps<'div'>) {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          'flex h-10 w-full shrink-0 items-center justify-between bg-[#f7f7f7] px-4 md:hidden'
        )}
        {...props}
      >
        <div className="z-20 flex w-full justify-end">
          <Menu className="text-neutral-800 dark:text-neutral-200" onClick={() => setOpen(!open)} />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-white p-10 dark:bg-neutral-900',
                className
              )}
            >
              <div
                className="absolute top-10 right-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/**
 * Label animation (expert):
 * - Do NOT animate `display` (Framer can't interpolate → layout jump / flicker).
 * - Do NOT use CSS `transition` on opacity (fights Framer).
 * - Keep label always in DOM; parent `overflow-hidden` + width tween reveals text smoothly.
 * - Soft opacity fade synced to sidebar width (Framer only).
 */
export function SidebarLink({
  link,
  className,
  active = false,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
  props?: LinkProps;
}) {
  const { open, animate } = useSidebar();
  const showLabel = !animate || open;
  // Collapsed: label stays in layout for width-clip animation, so row chip looks offset.
  // Put selected chip on the icon only; expanded keeps full-row chip.
  const collapsedActive = active && !showLabel;

  return (
    <Link
      href={link.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group/sidebar flex items-center justify-start gap-2 rounded-lg border px-2 py-2 no-underline transition-colors',
        'text-neutral-600',
        !active && 'border-transparent hover:bg-black/[0.03] hover:text-neutral-800',
        active &&
          showLabel &&
          'border-neutral-100 bg-white font-medium text-neutral-900 shadow-[0_1px_2px_rgb(15_23_42/5%)]',
        collapsedActive &&
          'border-transparent bg-transparent font-medium text-neutral-900 shadow-none',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'relative flex size-5 shrink-0 items-center justify-center [&>svg]:size-5',
          active ? 'text-neutral-900' : 'text-neutral-600'
        )}
      >
        {collapsedActive ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-100 bg-white shadow-[0_1px_2px_rgb(15_23_42/5%)]"
          />
        ) : null}
        <span className="relative z-1">{link.icon}</span>
      </span>
      <motion.span
        initial={false}
        animate={{ opacity: showLabel ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          // transition-transform ONLY — never bare `transition` (that also tweens opacity → giật)
          'm-0! inline-block p-0! text-sm whitespace-pre transition-transform duration-150 group-hover/sidebar:translate-x-1',
          active ? 'text-neutral-900' : 'text-neutral-600',
          !showLabel && 'pointer-events-none'
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
}
