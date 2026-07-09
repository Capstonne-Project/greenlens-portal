'use client';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  dismissible: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

type ModalProviderProps = {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  dismissible: boolean;
};

export const ModalProvider = ({ children, open, setOpen, dismissible }: ModalProviderProps) => {
  return (
    <ModalContext.Provider value={{ open, setOpen, dismissible }}>{children}</ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

type ModalProps = {
  children: ReactNode;
  /** Controlled open state — dùng khi mở modal từ state bên ngoài (không qua ModalTrigger). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Chặn đóng khi click overlay / nút X (vd. đang submit). */
  dismissible?: boolean;
};

export function Modal({
  children,
  open: controlledOpen,
  onOpenChange,
  dismissible = true,
}: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <ModalProvider open={open} setOpen={setOpen} dismissible={dismissible}>
      {children}
    </ModalProvider>
  );
}

export const ModalTrigger = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { setOpen } = useModal();
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md text-black dark:text-white text-center relative overflow-hidden',
        className
      )}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { open } = useModal();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [open]);

  const modalRef = useRef<HTMLDivElement>(null);
  const { setOpen, dismissible } = useModal();
  useOutsideClick(modalRef, () => {
    if (dismissible) setOpen(false);
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, dismissible, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
            backdropFilter: 'blur(4px)',
          }}
          exit={{
            opacity: 0,
            backdropFilter: 'blur(0px)',
          }}
          className="fixed [perspective:800px] [transform-style:preserve-3d] inset-0 h-full w-full  flex items-center justify-center z-50"
        >
          <Overlay />

          <motion.div
            ref={modalRef}
            className={cn(
              'min-h-[50%] max-h-[90%] md:max-w-[40%] bg-white dark:bg-neutral-950 border border-transparent dark:border-neutral-800 md:rounded-2xl relative z-50 flex flex-col flex-1 overflow-hidden',
              className
            )}
            initial={{
              opacity: 0,
              scale: 0.5,
              rotateX: 40,
              y: 40,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateX: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              rotateX: 10,
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 15,
            }}
          >
            <CloseIcon />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ModalContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={cn('flex flex-col flex-1 p-8 md:p-10', className)}>{children}</div>;
};

export const ModalFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('flex justify-end p-4 bg-gray-100 dark:bg-neutral-900', className)}>
      {children}
    </div>
  );
};

const Overlay = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        backdropFilter: 'blur(4px)',
      }}
      exit={{
        opacity: 0,
        backdropFilter: 'blur(0px)',
      }}
      className={cn('fixed inset-0 z-50 h-full w-full bg-black/40 backdrop-blur-sm', className)}
    ></motion.div>
  );
};

const CloseIcon = () => {
  const { setOpen, dismissible } = useModal();
  if (!dismissible) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="absolute top-4 right-4 group"
      aria-label="Đóng"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-black dark:text-white h-4 w-4 group-hover:scale-125 group-hover:rotate-3 transition duration-200"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};

// Hook to detect clicks outside of a component.
// Add it in a separate file, I've added here for simplicity
export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  callback: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!ref.current || !(target instanceof Node) || ref.current.contains(target)) {
        return;
      }
      if (
        target instanceof Element &&
        target.closest(
          '[data-radix-popper-content-wrapper], [data-radix-select-content], [data-radix-menu-content]'
        )
      ) {
        return;
      }
      callback();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, callback]);
};
