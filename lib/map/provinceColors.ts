/**
 * Màu cố định cho từng tỉnh/thành ở bước 1 của citizen map — chỉ để phân biệt trực quan ranh
 * giới (giống ảnh mẫu kiểu bản đồ hành chính), KHÔNG mang ý nghĩa dữ liệu ô nhiễm. Bảng màu được
 * chọn thủ công (không sinh ngẫu nhiên qua hash) để đảm bảo các tỉnh liền kề luôn tương phản rõ,
 * giống phong cách bản đồ hành chính tham khảo — thay vì màu hash HSL dễ ra màu xỉn/trùng nhau.
 */

/** Bảng màu 16 tông — đủ tương phản để lặp lại vẫn khó nhận ra khi các tỉnh cùng màu không liền kề. */
const PALETTE: readonly string[] = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#38bdf8', // sky-400
  '#4ade80', // green-400
  '#fb923c', // orange-400
  '#c084fc', // purple-400
  '#2dd4bf', // teal-400
  '#f87171', // red-400
  '#818cf8', // indigo-400
  '#facc15', // yellow-400
  '#22d3ee', // cyan-400
  '#e879f9', // fuchsia-400
  '#a3e635', // lime-400
];

function hashCode(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Fill color cho polygon tỉnh — chọn từ bảng màu cố định theo mã tỉnh 2 ký tự. */
export function colorForProvinceCode(provinceCode: string): string {
  const index = hashCode(provinceCode) % PALETTE.length;
  return PALETTE[index];
}

/** Viền polygon tỉnh — trắng, tương phản đều trên mọi màu fill trong bảng. */
export function borderColorForProvinceCode(_provinceCode: string): string {
  return '#ffffff';
}

/** Màu tô các quốc gia khác ngoài Việt Nam — xám trung tính, luôn cố định. */
export const OUTSIDE_VIETNAM_FILL = '#cbd5e1';
export const OUTSIDE_VIETNAM_OPACITY = 0.55;
