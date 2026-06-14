// 'use client';

// import { Button } from '@/components/ui/button';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Input } from '@/components/ui/input';
// import { PaginationSimple } from '@/components/ui/pagination';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
// // import { useDeoMyOffices, useDeoMyOfficesInfinite } from '@/hooks/useDeoOffices';
// import type { DepartmentOfficeSummary } from '@/lib/api/models/department';
// // import type { DeoMyOfficesSortBy } from '@/lib/api/models/department';
// import { Loader2, Search } from 'lucide-react';
//   import { useEffect, useMemo, useRef, useState } from 'react';

// const DEFAULT_PAGE_SIZE = 10;
// const INFINITE_PAGE_SIZE = 8;
// /** Chiều cao một slot dòng dữ liệu (rem) — khớp py-3 + text-sm */
// const TABLE_ROW_SLOT_REM = 3;
// const TABLE_HEAD_ROW_REM = 2.75;

// function tableScrollMinHeight(rowSlots: number) {
//   return `calc(${TABLE_HEAD_ROW_REM}rem + ${rowSlots} * ${TABLE_ROW_SLOT_REM}rem)`;
// }

// function tableBodyMinHeight(rowSlots: number) {
//   return `${rowSlots * TABLE_ROW_SLOT_REM}rem`;
// }

// const BASE_COLS = ['PHƯỜNG / XÃ', 'ĐƠN VỊ', 'LEO PHỤ TRÁCH', 'SỐ ĐỘI'];

// // export const SORT_OPTIONS: Array<{ value: DeoMyOfficesSortBy; label: string }> = [
// //   { value: 'name', label: 'Tên đơn vị' },
// //   { value: 'wardName', label: 'Phường / xã' },
// //   { value: 'officerName', label: 'LEO phụ trách' },
// //   { value: 'teamCount', label: 'Số đội' },
// //   { value: 'createdAt', label: 'Ngày tạo' },
// // ];

// function SkeletonRows({ colCount, rows = 5 }: { colCount: number; rows?: number }) {
//   return (
//     <>
//       {Array.from({ length: rows }, (_, i) => `s${i}`).map(key => (
//         <tr key={key} className="animate-pulse border-t border-border">
//           {Array.from({ length: colCount }, (_, i) => `c${i}`).map(ck => (
//             <td key={ck} className="px-4 py-3">
//               <div className="h-3 w-20 rounded bg-muted" />
//             </td>
//           ))}
//         </tr>
//       ))}
//     </>
//   );
// }

// function OfficeRow({
//   office,
//   selectable,
//   checked,
//   onSelectOffice,
// }: {
//   office: DepartmentOfficeSummary;
//   selectable: boolean;
//   checked: boolean;
//   onSelectOffice?: (officeId: string) => void;
// }) {
//   return (
//     <tr
//       className={`border-t border-border transition ${
//         checked ? 'bg-emerald-50/60' : 'hover:bg-muted/20'
//       } ${selectable ? 'cursor-pointer' : ''}`}
//       onClick={selectable ? () => onSelectOffice?.(office.id) : undefined}
//     >
//       {selectable && (
//         <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
//           <Checkbox checked={checked} onCheckedChange={() => onSelectOffice?.(office.id)} />
//         </td>
//       )}
//       <td className="px-4 py-3 text-foreground">{office.wardName}</td>
//       <td className="px-4 py-3 font-medium text-foreground">{office.name}</td>
//       <td className="px-4 py-3 text-muted-foreground">{office.officerName ?? '—'}</td>
//       <td className="px-4 py-3 tabular-nums text-foreground">{office.teamCount}</td>
//     </tr>
//   );
// }

// export interface DeoOfficesTableProps {
//   selectable?: boolean;
//   selectedOfficeIds?: string[];
//   onToggleOffice?: (officeId: string) => void;
//   /** `infinite` — cuộn tải thêm (dialog); `pages` — nút phân trang */
//   paginationMode?: 'pages' | 'infinite';
//   pageSize?: number;
//   onMetaChange?: (meta: { departmentName?: string }) => void;
//   className?: string;
// }

// export function DeoOfficesTable({
//   selectable = false,
//   selectedOfficeIds = [],
//   onToggleOffice,
//   paginationMode = 'pages',
//   pageSize,
//   // onMetaChange,
//   className = '',
// }: DeoOfficesTableProps) {
//   const isInfinite = paginationMode === 'infinite';
//   const resolvedPageSize = pageSize ?? (isInfinite ? INFINITE_PAGE_SIZE : DEFAULT_PAGE_SIZE);

//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState('');
//   const trimmedSearch = search.trim();
//   const debouncedSearch = useDebouncedValue(trimmedSearch, SEARCH_DEBOUNCE_MS, () => {
//     setPage(1);
//   });
//   const isSearchPending = trimmedSearch !== debouncedSearch;
//   // const [sortBy, setSortBy] = useState<DeoMyOfficesSortBy>('name');
//   const [sortDesc, setSortDesc] = useState(false);

//   const scrollRef = useRef<HTMLDivElement>(null);
//   const loadMoreRef = useRef<HTMLTableRowElement>(null);

//   // const filterParams = useMemo(
//   //   () => ({
//   //     pageSize: resolvedPageSize,
//   //     ...(debouncedSearch ? { search: debouncedSearch } : {}),
//   //     sortBy,
//   //     sortDesc,
//   //   }),
//   //   [resolvedPageSize, debouncedSearch, sortBy, sortDesc]
//   // );

//   // const pagedQuery = useDeoMyOffices({ page, ...filterParams }, { enabled: !isInfinite });

//   // const infiniteQuery = useDeoMyOfficesInfinite(filterParams, { enabled: isInfinite });

//   // const pagedData = pagedQuery.data;
//   // const infiniteData = infiniteQuery.data;

//   // const offices = isInfinite
//   //   ? (infiniteData?.pages.flatMap(page => page.data.offices) ?? [])
//   //   : (pagedData?.offices ?? []);

//   // const departmentName = isInfinite
//   //   ? infiniteData?.pages[0]?.data.departmentName
//   //   : pagedData?.departmentName;

//   // const pagination = isInfinite
//   //   ? infiniteData?.pages.at(-1)?.data.pagination
//   //   : pagedData?.pagination;

//   // const totalPages = Math.max(1, pagination?.totalPages ?? 1);
//   // const hasNextPage = isInfinite ? (infiniteQuery.hasNextPage ?? false) : page < totalPages;

//   // const isInitialLoading =
//   //   offices.length === 0 &&
//   //   (isInfinite ? infiniteQuery.isPending : pagedQuery.isPending) &&
//   //   !(isInfinite ? infiniteQuery.isError : pagedQuery.isError);
//   // const isRefetching =
//   //   offices.length > 0 &&
//   //   (isInfinite
//   //     ? infiniteQuery.isFetching && !infiniteQuery.isFetchingNextPage
//   //     : pagedQuery.isFetching);
//   // const isFetchingMore = isInfinite && infiniteQuery.isFetchingNextPage;
//   // const isError = isInfinite ? infiniteQuery.isError : pagedQuery.isError;

//   const colCount = selectable ? BASE_COLS.length + 1 : BASE_COLS.length;
//   const viewportMinHeight = tableScrollMinHeight(resolvedPageSize);
//   const bodyMinHeight = tableBodyMinHeight(resolvedPageSize);

//   // useEffect(() => {
//   //   onMetaChange?.({ departmentName });
//   // }, [departmentName, onMetaChange]);

//   const resetPagedFilters = () => setPage(1);

//   useEffect(() => {
//     if (!isInfinite || !scrollRef.current) return;
//     scrollRef.current.scrollTop = 0;
//   }, [debouncedSearch, sortDesc, isInfinite]);

//   // useEffect(() => {
//   //   if (!isInfinite) return;
//   //   const root = scrollRef.current;
//   //   const target = loadMoreRef.current;
//   //   if (!root || !target) return;

//   //   const observer = new IntersectionObserver(
//   //     entries => {
//   //       const entry = entries[0];
//   //       if (
//   //         entry?.isIntersecting &&
//   //         infiniteQuery.hasNextPage &&
//   //         !infiniteQuery.isFetchingNextPage
//   //       ) {
//   //         void infiniteQuery.fetchNextPage();
//   //       }
//   //     },
//   //     { root, rootMargin: '64px', threshold: 0 }
//   //   );

//     observer.observe(target);
//     return () => observer.disconnect();
//   }, [
//     isInfinite,
//     infiniteQuery.hasNextPage,
//     infiniteQuery.isFetchingNextPage,
//     infiniteQuery.fetchNextPage,
//     offices.length,
//     filterParams,
//   ]);

//   return (
//     <div className={`flex min-h-0 flex-col ${className}`}>
//       <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border p-3">
//         <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-36">
//           <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
//           <Input
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Tìm đơn vị, phường, LEO..."
//             className={`h-9 rounded-lg pl-9 text-sm ${isSearchPending ? 'pr-9' : ''}`}
//             aria-busy={isSearchPending}
//           />
//           {isSearchPending ? (
//             <Loader2
//               className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
//               aria-hidden
//             />
//           ) : null}
//         </div>

//         <Select
//           value={sortBy}
//           onValueChange={v => {
//             setSortBy(v as DeoMyOfficesSortBy);
//             resetPagedFilters();
//           }}
//         >
//           <SelectTrigger className="h-9 w-full min-w-0 rounded-lg text-sm sm:w-36">
//             <SelectValue placeholder="Sắp xếp" />
//           </SelectTrigger>
//           <SelectContent>
//             {SORT_OPTIONS.map(opt => (
//               <SelectItem key={opt.value} value={opt.value}>
//                 {opt.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>

//         <Button
//           variant="outline"
//           size="sm"
//           className="h-9 rounded-lg text-sm"
//           onClick={() => {
//             setSortDesc(v => !v);
//             resetPagedFilters();
//           }}
//         >
//           {sortDesc ? 'Giảm dần' : 'Tăng dần'}
//         </Button>
//       </div>

//       <div
//         ref={scrollRef}
//         className="scrollbar-smooth relative isolate min-h-0 flex-1 overflow-x-auto overflow-y-auto"
//         style={{ minHeight: viewportMinHeight }}
//       >
//         <table
//           className={`w-full border-separate border-spacing-0 text-sm transition-opacity ${
//             isRefetching ? 'pointer-events-none opacity-50' : ''
//           }`}
//         >
//           <thead>
//             <tr>
//               {selectable && (
//                 <th className="sticky top-0 z-20 w-12 border-b border-border bg-card px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))]">
//                   CHỌN
//                 </th>
//               )}
//               {BASE_COLS.map(h => (
//                 <th
//                   key={h}
//                   className="sticky top-0 z-20 border-b border-border bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))]"
//                 >
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="relative z-0 bg-card" style={{ minHeight: bodyMinHeight }}>
//             {isInitialLoading && <SkeletonRows colCount={colCount} rows={resolvedPageSize} />}
//             {isError && !isInitialLoading && (
//               <tr>
//                 <td colSpan={colCount} className="align-middle px-4 text-center text-muted-foreground">
//                   <div
//                     className="flex items-center justify-center"
//                     style={{ minHeight: bodyMinHeight }}
//                   >
//                     Không tải được danh sách đơn vị.
//                   </div>
//                 </td>
//               </tr>
//             )}
//             {!isInitialLoading && !isError && offices.length === 0 && (
//               <tr>
//                 <td colSpan={colCount} className="align-middle px-4 text-center text-muted-foreground">
//                   <div
//                     className="flex items-center justify-center"
//                     style={{ minHeight: bodyMinHeight }}
//                   >
//                     Không có đơn vị phù hợp.
//                   </div>
//                 </td>
//               </tr>
//             )}
//             {!isInitialLoading &&
//               !isError &&
//               offices.map(office => (
//                 <OfficeRow
//                   key={office.id}
//                   office={office}
//                   selectable={selectable}
//                   checked={selectedOfficeIds.includes(office.id)}
//                   onSelectOffice={onToggleOffice}
//                 />
//               ))}
//             {isInfinite && !isInitialLoading && !isError && hasNextPage && (
//               <tr ref={loadMoreRef}>
//                 <td colSpan={colCount} className="px-4 py-6">
//                   <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
//                     {isFetchingMore ? (
//                       <>
//                         <Loader2 className="size-4 animate-spin" />
//                         Đang tải thêm...
//                       </>
//                     ) : (
//                       <span className="text-xs">Cuộn để tải thêm</span>
//                     )}
//                   </div>
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {!isInfinite && (
//         <div className="mt-auto flex shrink-0 justify-end border-t border-border p-3">
//           <PaginationSimple
//             page={page}
//             totalPages={totalPages}
//             onPageChange={setPage}
//             className={isInitialLoading ? 'pointer-events-none opacity-60' : 'w-auto'}
//           />
//         </div>
//       )}
//     </div>
//   );
// }
