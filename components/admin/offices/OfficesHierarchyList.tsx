'use client';

import type { OfficeListItem } from '@/lib/api/models/office';
import type { OfficeDepartmentGroup } from '@/utils/officeHierarchy';
import { Button } from '@/components/ui/button';
import { Building2, ChevronDown, ChevronRight, Pencil, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';

interface OfficesHierarchyListProps {
  groups: OfficeDepartmentGroup[];
  onEdit: (office: OfficeListItem) => void;
  onAssign: (office: OfficeListItem) => void;
}

export function OfficesHierarchyList({ groups, onEdit, onAssign }: OfficesHierarchyListProps) {
  const allDeptIds = useMemo(() => groups.map(g => g.departmentId), [groups]);
  /** Mặc định thu gọn — F5 / quay lại trang đều đóng hết */
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = (departmentId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(allDeptIds));
  const collapseAll = () => setExpanded(new Set());

  if (groups.length === 0) return null;

  return (
    <div className="px-4 sm:px-6">
      <div className="flex justify-end gap-2 border-b border-border py-3">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={expandAll}
          className="h-auto p-0 text-xs font-medium text-emerald-700"
        >
          Mở tất cả
        </Button>
        <span className="text-border">|</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={collapseAll}
          className="h-auto p-0 text-xs font-medium text-muted-foreground"
        >
          Thu gọn
        </Button>
      </div>

      <div className="divide-y divide-border">
        {groups.map(group => {
          const isOpen = expanded.has(group.departmentId);
          return (
            <section key={group.departmentId}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(group.departmentId)}
                className="h-auto w-full justify-start gap-3 rounded-none py-4 text-left font-normal hover:bg-muted/40"
              >
                <span className="text-muted-foreground">
                  {isOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </span>
                <Building2 className="size-4 shrink-0 text-emerald-700" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{group.departmentName}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.wardCount} phường/xã · {group.onboardedCount} onboard
                  </span>
                </span>
              </Button>

              {isOpen && (
                <div className="overflow-x-auto pb-4 pl-9">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Văn phòng</th>
                        <th className="pb-2 pr-4 font-medium">Phường / Xã</th>
                        <th className="pb-2 pr-4 font-medium">LEO</th>
                        <th className="pb-2 pr-4 font-medium">Thiết lập</th>
                        <th className="pb-2 text-right font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.offices.map(office => (
                        <tr
                          key={office.id}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/20"
                        >
                          <td className="py-2.5 pr-4 font-medium">{office.name}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">
                            {office.wardName}
                            <span className="ml-1 text-xs opacity-70">({office.wardCode})</span>
                          </td>
                          <td className="py-2.5 pr-4">{office.officerName ?? '—'}</td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                office.isOnboarded
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {office.isOnboarded ? 'Có' : 'Chưa'}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <div className="flex justify-end gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Sửa tên"
                                onClick={() => onEdit(office)}
                                className="text-muted-foreground"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Phân công LEO"
                                onClick={() => onAssign(office)}
                                className="text-muted-foreground"
                              >
                                <UserPlus className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
