/**
 * Nhãn cột bảng hàng đợi báo cáo (Verify / Assign / DEO).
 * Một nguồn — tránh lệch nghĩa giữa các màn officer.
 *
 * Glossary (khớp filter / detail / Leo tracking):
 * - Loại ô nhiễm (không dùng "Category" / "Loại rác thải")
 * - Mức độ (giá trị: REPORT_SEVERITY_LABEL_VI; filter section dài hơn: "Mức độ nghiêm trọng")
 * - Điểm ưu tiên (= priorityScore, không nhầm Priority level)
 * - Hạn xác minh / Hạn xử lý (song song; Leo dùng "Hạn xử lý")
 */
export const REPORT_QUEUE_COLUMN_LABEL = {
  select: 'Chọn',
  image: 'Hình ảnh',
  code: 'Mã báo cáo',
  category: 'Loại ô nhiễm',
  severity: 'Mức độ',
  status: 'Trạng thái',
  priority: 'Điểm ưu tiên',
  address: 'Địa chỉ',
  created: 'Ngày tạo',
  verifySla: 'Hạn xác minh',
  resolveSla: 'Hạn xử lý',
  /** Cột nút xác minh / xem chi tiết */
  actions: 'Thao tác',
  /** Assign — mở chương trình dọn cộng đồng */
  community: 'Cộng đồng',
} as const;

export type ReportQueueColumnLabelKey = keyof typeof REPORT_QUEUE_COLUMN_LABEL;
