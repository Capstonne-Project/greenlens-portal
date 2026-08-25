'use client';

import { getWasteTagFaIcon } from '@/lib/constants/adminWasteTags';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Check } from 'lucide-react';
import Image from 'next/image';

export interface WasteTagSelectChipTag {
  id: string;
  code: string;
  nameVi: string;
  iconUrl?: string | null;
}

export interface WasteTagBadgeTag {
  code: string;
  nameVi: string;
  iconUrl?: string | null;
}

interface WasteTagSelectChipProps {
  tag: WasteTagSelectChipTag;
  selected: boolean;
  disabled?: boolean;
  onToggle: (tagId: string) => void;
}

function isRemoteIconUrl(url: string | null | undefined): url is string {
  const value = url?.trim();
  return Boolean(
    value && (value.startsWith('http://') || value.startsWith('https://')) && value !== 'string'
  );
}

function WasteTagGlyph({
  code,
  nameVi,
  iconUrl,
}: {
  code: string;
  nameVi: string;
  iconUrl?: string | null;
}) {
  const remoteUrl = isRemoteIconUrl(iconUrl) ? iconUrl.trim() : null;
  const faIcon = getWasteTagFaIcon(code, nameVi);

  if (remoteUrl) {
    return (
      <Image
        src={remoteUrl}
        alt=""
        width={12}
        height={12}
        className="size-3 shrink-0 object-contain"
        unoptimized
      />
    );
  }

  return <FontAwesomeIcon icon={faIcon} className="size-2.5 shrink-0" aria-hidden />;
}

/** Badge hiển thị loại rác — `match` đậm hơn `default`; `muted` xám để tách tag không khớp. */
export function WasteTagBadge({
  tag,
  className,
  tone = 'default',
}: {
  tag: WasteTagBadgeTag;
  className?: string;
  tone?: 'default' | 'match' | 'muted';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight',
        tone === 'muted' && 'border-slate-200 bg-slate-100 font-normal text-slate-400',
        tone === 'match' && 'border-brand/40 bg-brand/25 font-semibold text-brand',
        tone === 'default' && 'border-brand/20 bg-brand/10 text-brand',
        className
      )}
    >
      <WasteTagGlyph code={tag.code} nameVi={tag.nameVi} iconUrl={tag.iconUrl} />
      {tag.nameVi}
    </span>
  );
}

/** Hàng badge loại rác trên card — hiện đủ tag, wrap; chiều cao card do grid stretch. */
export function WasteTagBadgeRow({ tags }: { tags: Array<WasteTagBadgeTag & { tagId: string }> }) {
  if (tags.length === 0) return <div className="min-h-6" aria-hidden />;

  return (
    <div className="flex min-h-6 min-w-0 flex-wrap content-start gap-2">
      {tags.map(tag => (
        <WasteTagBadge key={tag.tagId} tag={tag} />
      ))}
    </div>
  );
}

/** Chip chọn loại rác — icon theo code/tên; selected dùng brand green dịu, không emerald chói. */
export function WasteTagSelectChip({ tag, selected, disabled, onToggle }: WasteTagSelectChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(tag.id)}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-brand/20 bg-brand/10 text-brand'
          : 'border-slate-200 bg-white text-slate-600 hover:border-brand/20 hover:bg-brand/5 hover:text-brand'
      )}
      aria-pressed={selected}
    >
      <WasteTagGlyph code={tag.code} nameVi={tag.nameVi} iconUrl={tag.iconUrl} />
      {selected ? <Check className="size-3 shrink-0" aria-hidden /> : null}
      {tag.nameVi}
    </button>
  );
}
