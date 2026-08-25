'use client';

import { useMyOfficesInfinite } from '@/hooks/useDepartments';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Loader2, Minus, Plus, Search, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

const SEARCH_DEBOUNCE_MS = 300;
const CHIP_PREVIEW_COUNT = 6;

export interface OfficeWardDepartmentMeta {
  departmentId: string;
  departmentName: string;
}

type OfficeOption = { wardCode: string; name: string };

type OfficeWardSelectBase = {
  id?: string;
  /** Dialog/popover cha đang mở — tránh fetch khi ẩn. */
  active?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  hint?: string;
  /** Tên hiển thị sẵn (vd. refill địa bàn hiện có) — không chờ mở dropdown. */
  initialLabels?: Record<string, string>;
  onDepartmentMeta?: (meta: OfficeWardDepartmentMeta | null) => void;
  onLoadError?: (hasError: boolean) => void;
};

export type OfficeWardSelectProps = OfficeWardSelectBase &
  (
    | { multiple?: false; value: string; onChange: (wardCode: string) => void }
    | { multiple: true; value: string[]; onChange: (wardCodes: string[]) => void }
  );

function unionCodes(current: string[], incoming: string[]): string[] {
  const next = new Set(current);
  for (const code of incoming) next.add(code);
  return [...next];
}

function withoutCodes(current: string[], incoming: string[]): string[] {
  const drop = new Set(incoming);
  return current.filter(code => !drop.has(code));
}

function parentCheckState(loadedCodes: string[], selectedCodes: string[]) {
  if (loadedCodes.length === 0) return 'none' as const;
  const selected = new Set(selectedCodes);
  const selectedCount = loadedCodes.filter(code => selected.has(code)).length;
  if (selectedCount === 0) return 'none' as const;
  if (selectedCount === loadedCodes.length) return 'all' as const;
  return 'some' as const;
}

export function OfficeWardSelect(props: OfficeWardSelectProps) {
  const {
    id: idProp,
    active = true,
    disabled = false,
    placeholder = '— Chọn văn phòng MT phường/xã —',
    searchPlaceholder = 'Tìm phường, xã hoặc tên văn phòng…',
    emptyMessage = 'Không có văn phòng MT cấp phường/xã.',
    hint,
    initialLabels,
    onDepartmentMeta,
    onLoadError,
  } = props;
  const isMultiple = props.multiple === true;
  const selectedCodes = isMultiple ? props.value : props.value ? [props.value] : [];
  const fieldHint =
    hint ??
    (isMultiple
      ? 'Chọn một hoặc nhiều phường/xã. Có thể chọn cả Sở để gán toàn bộ địa bàn đã tải.'
      : undefined);

  const autoId = useId();
  const listboxId = `${idProp ?? autoId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const loadMoreRef = useRef<HTMLLIElement>(null);

  const [open, setOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(true);
  const [showAllChips, setShowAllChips] = useState(false);
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

  const nameByCode = useMemo(() => {
    const map: Record<string, string> = { ...(initialLabels ?? {}) };
    for (const office of offices) {
      map[office.wardCode] = office.name;
    }
    return map;
  }, [initialLabels, offices]);

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

  const selectedOffices: OfficeOption[] = selectedCodes.map(code => ({
    wardCode: code,
    name: nameByCode[code] ?? code,
  }));
  const loadedCodes = offices.map(office => office.wardCode);
  const groupState = parentCheckState(loadedCodes, selectedCodes);
  const isInitialLoading = fetchEnabled && isPending;
  const groupLabel = departmentMeta?.departmentName ?? 'Sở tài nguyên và môi trường';

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

  const handleSelect = (office: OfficeOption) => {
    if (isMultiple) {
      const exists = props.value.includes(office.wardCode);
      props.onChange(
        exists
          ? props.value.filter(code => code !== office.wardCode)
          : [...props.value, office.wardCode]
      );
      return;
    }

    props.onChange(office.wardCode);
    closeDropdown();
  };

  const handleRemove = (wardCode: string) => {
    if (!isMultiple) return;
    props.onChange(props.value.filter(code => code !== wardCode));
  };

  const handleClearAll = () => {
    if (!isMultiple) return;
    props.onChange([]);
  };

  const handleToggleGroup = () => {
    if (!isMultiple || loadedCodes.length === 0) return;
    props.onChange(
      groupState === 'all'
        ? withoutCodes(props.value, loadedCodes)
        : unionCodes(props.value, loadedCodes)
    );
  };

  const toggleOpen = () => {
    if (disabled || isInitialLoading) return;
    if (open) {
      closeDropdown();
      return;
    }
    setOpen(true);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      closeDropdown();
    }
  };

  const triggerLabel = (() => {
    if (isInitialLoading) return 'Đang tải…';
    if (selectedOffices.length === 0) return placeholder;
    if (!isMultiple) return selectedOffices[0]?.name ?? placeholder;
    return `${selectedOffices.length} địa bàn đã chọn`;
  })();

  const visibleChips = showAllChips
    ? selectedOffices
    : selectedOffices.slice(0, CHIP_PREVIEW_COUNT);
  const hiddenChipCount = selectedOffices.length - visibleChips.length;

  return (
    <div ref={rootRef} className="space-y-2">
      {isMultiple && selectedOffices.length > 0 ? (
        <div className="space-y-1.5 pb-2">
          <ul className="flex flex-wrap gap-1.5">
            {visibleChips.map(office => (
              <li
                key={office.wardCode}
                className="flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-950"
              >
                <span className="truncate">{office.name}</span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Bỏ ${office.name}`}
                  onClick={() => handleRemove(office.wardCode)}
                  className="rounded-full p-0.5 text-emerald-800/70 hover:bg-emerald-100 hover:text-emerald-950 disabled:opacity-50"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {hiddenChipCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllChips(true)}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Xem thêm… (+{hiddenChipCount})
            </button>
          ) : null}
          {showAllChips && selectedOffices.length > CHIP_PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={() => setShowAllChips(false)}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Thu gọn
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        <div
          id={idProp}
          role="combobox"
          tabIndex={disabled || isInitialLoading ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-disabled={disabled || isInitialLoading}
          aria-multiselectable={isMultiple || undefined}
          onClick={toggleOpen}
          onKeyDown={onTriggerKeyDown}
          className={cn(
            'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm outline-none',
            'focus-visible:ring-2 focus-visible:ring-emerald-500/40',
            (disabled || isInitialLoading) && 'cursor-not-allowed opacity-60'
          )}
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              selectedOffices.length === 0 && 'text-muted-foreground'
            )}
          >
            {triggerLabel}
          </span>
          {isMultiple && selectedOffices.length > 0 ? (
            <button
              type="button"
              disabled={disabled}
              aria-label="Bỏ chọn tất cả địa bàn"
              onClick={e => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
          {isInitialLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition',
                open && 'rotate-180'
              )}
              aria-hidden
            />
          )}
        </div>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable={isMultiple || undefined}
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
          >
            <div className="border-b border-border p-2">
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-md border border-input bg-background py-1 pl-8 pr-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              </label>
            </div>

            <ul ref={listRef} className="max-h-64 overflow-y-auto py-1">
              {isError && (
                <li className="px-3 py-2 text-sm text-destructive">
                  Không tải được danh sách văn phòng cấp phường/xã.
                </li>
              )}
              {!isError && !isInitialLoading && offices.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
              )}

              {!isError && offices.length > 0 && isMultiple ? (
                <li className="px-1.5 py-0.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-expanded={groupOpen}
                      aria-label={groupOpen ? 'Thu gọn nhóm' : 'Mở nhóm'}
                      onClick={() => setGroupOpen(v => !v)}
                      className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                    >
                      {groupOpen ? (
                        <Minus className="size-3.5" aria-hidden />
                      ) : (
                        <Plus className="size-3.5" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleGroup}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1.5 text-left text-sm hover:bg-muted/60"
                    >
                      <TriStateMark state={groupState} />
                      <span className="truncate font-medium">{groupLabel}</span>
                    </button>
                  </div>
                </li>
              ) : null}

              {groupOpen &&
                offices.map(office => {
                  const isSelected = selectedCodes.includes(office.wardCode);
                  return (
                    <li
                      key={office.id}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(isMultiple && 'pl-8')}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleSelect({ wardCode: office.wardCode, name: office.name })
                        }
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/60',
                          isSelected && 'text-emerald-950'
                        )}
                      >
                        <TriStateMark state={isSelected ? 'all' : 'none'} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{office.name}</span>
                          {office.wardName && office.wardName !== office.name ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {office.wardName}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}

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
        ) : null}
      </div>

      {fieldHint ? <p className="text-xs text-muted-foreground">{fieldHint}</p> : null}
    </div>
  );
}

function TriStateMark({ state }: { state: 'all' | 'some' | 'none' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-4 shrink-0 place-content-center rounded-sm border',
        state === 'none'
          ? 'border-input bg-background'
          : 'border-emerald-600 bg-emerald-600 text-white'
      )}
    >
      {state === 'all' ? <Check className="size-3" strokeWidth={3} /> : null}
      {state === 'some' ? <Minus className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}
