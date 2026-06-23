'use client';

import { useMyOfficesInfinite } from '@/hooks/useDepartments';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

const SEARCH_DEBOUNCE_MS = 300;

export interface OfficeWardDepartmentMeta {
  departmentId: string;
  departmentName: string;
}

interface OfficeWardSelectProps {
  id?: string;
  value: string;
  onChange: (wardCode: string) => void;
  /** Dialog/popover cha đang mở — tránh fetch khi ẩn. */
  active?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onDepartmentMeta?: (meta: OfficeWardDepartmentMeta | null) => void;
  onLoadError?: (hasError: boolean) => void;
}

export function OfficeWardSelect({
  id: idProp,
  value,
  onChange,
  active = true,
  disabled = false,
  placeholder = '— Chọn văn phòng MT phường/xã —',
  searchPlaceholder = 'Tìm phường, xã hoặc tên văn phòng…',
  emptyMessage = 'Không có văn phòng MT cấp phường/xã.',
  onDepartmentMeta,
  onLoadError,
}: OfficeWardSelectProps) {
  const autoId = useId();
  const listboxId = `${idProp ?? autoId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const loadMoreRef = useRef<HTMLLIElement>(null);

  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchEnabled = active && open;

  useEffect(() => {
    if (!fetchEnabled) return;
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, fetchEnabled]);

  const { data, isPending, isError, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMyOfficesInfinite(debouncedSearch, fetchEnabled);

  const offices = useMemo(() => data?.pages.flatMap(page => page.offices) ?? [], [data?.pages]);

  const departmentMeta = useMemo<OfficeWardDepartmentMeta | null>(() => {
    const first = data?.pages[0];
    if (!first) return null;
    return { departmentId: first.departmentId, departmentName: first.departmentName };
  }, [data?.pages]);

  useEffect(() => {
    onDepartmentMeta?.(departmentMeta);
  }, [departmentMeta, onDepartmentMeta]);

  useEffect(() => {
    onLoadError?.(isError);
  }, [isError, onLoadError]);

  useEffect(() => {
    if (!open || !hasNextPage || isFetchingNextPage) return;
    const sentinel = loadMoreRef.current;
    const root = listRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { root, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, offices.length]);

  const selected = offices.find(office => office.wardCode === value);
  const isInitialLoading = fetchEnabled && isPending;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearchInput('');
    setDebouncedSearch('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, closeDropdown]);

  const handleSelect = (wardCode: string) => {
    onChange(wardCode);
    closeDropdown();
  };

  const toggleOpen = () => {
    if (disabled || isInitialLoading) return;
    if (open) {
      closeDropdown();
      return;
    }
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={idProp}
        disabled={disabled || isInitialLoading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggleOpen}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>
          {isInitialLoading ? 'Đang tải…' : (selected?.name ?? placeholder)}
        </span>
        {isInitialLoading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border p-2">
            <input
              type="search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              autoFocus
            />
          </div>
          <ul ref={listRef} className="max-h-52 overflow-y-auto py-1">
            {isError && (
              <li className="px-3 py-2 text-sm text-destructive">
                Không tải được danh sách văn phòng cấp phường/xã.
              </li>
            )}
            {!isError && !isInitialLoading && offices.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
            )}
            {offices.map(office => (
              <li key={office.id} role="option" aria-selected={office.wardCode === value}>
                <button
                  type="button"
                  onClick={() => handleSelect(office.wardCode)}
                  className={`flex w-full px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                    office.wardCode === value ? 'bg-emerald-50 font-medium text-emerald-900' : ''
                  }`}
                >
                  {office.name}
                </button>
              </li>
            ))}
            {isInitialLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <li key={`skeleton-${i}`} className="px-3 py-2">
                  <div className="h-4 animate-pulse rounded bg-muted" />
                </li>
              ))}
            {hasNextPage && (
              <li ref={loadMoreRef} className="flex justify-center py-2">
                {isFetchingNextPage && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
