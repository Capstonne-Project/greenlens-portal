# Kế hoạch: LEO xem tiến trình & duyệt Community Cleanup

> Trạng thái hiện tại: LEO portal **chỉ có** chức năng tạo chương trình (nút "mở chương trình dọn cộng đồng" trong `officer/assign`). Chưa có bất kỳ nơi nào để xem hàng đợi, tiến độ, ảnh before/progress/after, danh sách check-in, hay duyệt/từ chối xác thực khi Leader nộp. Backend đã có đủ endpoint cần thiết — đây thuần là việc bổ sung FE.

## 1. Bối cảnh & vấn đề

Luồng Community Cleanup hiện tại:

```
LEO tạo (OpenForJoin) → Citizens Join → Leader Start (InProgress)
  → Leader UpdateProgress (nhiều lần, kèm ảnh progress)
  → Leader SubmitVerification (≥1 before + ≥2 after ảnh, progress=100%) → PendingVerification
  → LEO Verify (Approve) → Completed  /  LEO Reject → InProgress (lặp lại)
```

Mobile (Leader/Citizen) đã cập nhật đầy đủ tiến độ, ảnh, check-in lên backend. Nhưng **LEO không có màn hình nào để xem** các dữ liệu này, và **không có nút Approve/Reject** — nghĩa là hiện tại một chương trình ở `PendingVerification` sẽ bị kẹt vô thời hạn vì không ai duyệt được.

## 2. API backend đã sẵn có (không cần đổi backend)

Tất cả nằm ở `CommunityCleanupsController` (`d:\CapsoneProject\Server\greenlens-service\src\Greenlens.Api\Controllers\CommunityCleanupsController.cs`):

| Method | Route                                                         | Dùng để                                                                                                                                                                                                                    | Role                                                          |
| ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| GET    | `/v1/community-cleanups/office-queue?page&pageSize&status`    | Hàng đợi LEO, mặc định lọc `PendingVerification`, scoped theo office                                                                                                                                                       | LEO,Admin                                                     |
| GET    | `/v1/community-cleanups/{eventId}`                            | Chi tiết event: status, progressPercent, progressNote, mediaSummary (đếm), participantCount, leader, meeting point, report info                                                                                            | Auth (bất kỳ role)                                            |
| GET    | `/v1/community-cleanups/{eventId}/participants?page&pageSize` | Danh sách đầy đủ participant (tên, role, status, joinedAt, checkedInAt)                                                                                                                                                    | Leader của event hoặc LEO/Admin                               |
| GET    | `/v1/reports/{reportId}/progress`                             | **Tái dùng nguyên endpoint report thường** — trả `media` group theo `MediaType.Before/Progress/After` (ảnh thật + URL), vì ảnh Community Cleanup ghi vào cùng bảng `ReportMedia` theo `ReportId`. Cũng có `statusHistory`. | LEO/Admin (đã có sẵn, dùng bởi `LeoTrackingReportDetail.tsx`) |
| POST   | `/v1/community-cleanups/{eventId}/verify`                     | Approve — `PendingVerification → Completed`, report → `Resolved`                                                                                                                                                           | LEO,Admin                                                     |
| POST   | `/v1/community-cleanups/{eventId}/reject-verification`        | Reject, body `{ reason }` (≥20 ký tự) — `PendingVerification → InProgress`                                                                                                                                                 | LEO,Admin                                                     |
| POST   | `/v1/community-cleanups/{eventId}/cancel`                     | Hủy chương trình, body `{ reason }` (≥20 ký tự)                                                                                                                                                                            | LEO,Admin                                                     |

Response shapes (C# records, namespace `Greenlens.Application.Features.CommunityCleanup.Common.CommunityCleanupDtos`):

- `CommunityCleanupEventDetailResponse` — đã có `ProgressPercent`, `ProgressNote`, `MediaSummary` (before/progress/after **count**, không có URL — lấy URL qua `/reports/{reportId}/progress`).
- `CommunityCleanupListResponse` — `Items: CommunityCleanupListItemDto[]` + `Pagination`.
- `CommunityCleanupParticipantsResponse` — `Items: CommunityCleanupParticipantDto[]` (UserId, FullName, AvatarUrl, Role, Status, JoinedAt, CheckedInAt) + `Pagination`.

**Không cần sửa gì ở backend cho phần LEO xem/duyệt.** (Nếu sau này cần lọc queue theo severity/category thì mới tính thêm.)

## 3. Việc cần làm ở FE (`D:\CapsoneProject\Client\greenlens-portal`)

### 3.1. Lớp API (model / dto / adapter / service / hook)

- `lib/api/dto/communityCleanup.dto.ts` — thêm:
  - `CommunityCleanupListItemDto`, `CommunityCleanupParticipantDto`, `PaginationMetaDto` (nếu chưa có sẵn kiểu chung) khớp response BE.
- `lib/api/models/communityCleanup.ts` — thêm model FE tương ứng (`CommunityCleanupListItem`, `CommunityCleanupParticipant`), và cập nhật `CommunityCleanupEventDetail` để có `progressNote` (đang thiếu trong model dù DTO đã có).
- `lib/api/adapters/communityCleanup.adapter.ts` — thêm adapter cho queue/detail/participants (map Dto → Model).
- `lib/api/services/fetchCommunityCleanup.ts` — thêm:
  - `getOfficeCommunityQueue(params)` → GET `/v1/community-cleanups/office-queue`
  - `getCommunityCleanupDetail(eventId)` → GET `/v1/community-cleanups/{eventId}`
  - `getCommunityCleanupParticipants(eventId, params)` → GET `/v1/community-cleanups/{eventId}/participants`
  - `verifyCommunityCleanup(eventId)` → POST `/v1/community-cleanups/{eventId}/verify`
  - `rejectCommunityVerification(eventId, reason)` → POST `/v1/community-cleanups/{eventId}/reject-verification`
  - `cancelCommunityCleanup(eventId, reason)` → POST `/v1/community-cleanups/{eventId}/cancel` (nếu muốn LEO hủy được từ đây)
- `hooks/useCommunityCleanup.ts` — thêm hook tương ứng theo pattern hiện có (`useCreateCommunityCleanup`), có thể dùng React Query nếu portal đã dùng (kiểm tra `useReportProgress` trong `hooks/useReport.ts` để theo đúng convention).

### 3.2. Trang hàng đợi (Queue)

- Route mới: `app/(officer)/officer/community/page.tsx` (đặt cùng cấp với `officer/tracking`, `officer/verify`).
- Thêm mục nav "Cộng đồng" / "Community Cleanup" vào sidebar LEO (tìm file nav — có thể là `components/officer/shared/*Sidebar*` hoặc layout `app/(officer)/officer/layout.tsx`).
- UI: bảng/danh sách các event, mặc định lọc `PendingVerification` (theo đúng ý nghĩa `office-queue`), có tab/filter đổi sang xem tất cả status. Mỗi row: report code, title, leader, progress%, participantCount, status badge, thumbnailUrl, nút "Xem chi tiết".
- Tham khảo cấu trúc từ `app/(officer)/officer/verify/page.tsx` (danh sách chờ duyệt) hoặc `app/(officer)/officer/tracking/page.tsx` (danh sách theo dõi tiến độ) — cái nào gần hơn về UX thì dùng làm khung.

### 3.3. Trang chi tiết (Detail) — ghép Tracking + Verify

- Route mới: `app/(officer)/officer/community/[id]/page.tsx`.
- Component chính mới: `components/officer/community/CommunityCleanupDetailClient.tsx`, kết hợp 2 pattern đã có:
  - **Từ `components/officer/tracking/LeoTrackingReportDetail.tsx`**: `ProgressCircle`/`ProgressRingSm` cho `progressPercent`, `MediaProgressTimeline` (before/progress/after) — nạp ảnh qua `GET /v1/reports/{reportId}/progress` (dùng `reportId` lấy từ event detail), `StatusHistoryFeed` nếu muốn hiện lịch sử report song song.
  - **Từ `components/officer/verify/VerifyDetailClient.tsx`**: `StatusBadge`, action bar Approve/Reject + dialog nhập lý do reject (theo mẫu `RejectReportDialog`, đổi tên/gọi thành `RejectCommunityVerificationDialog` — lý do ≥20 ký tự khớp validator BE).
  - **Mới, chưa có sẵn để tái dùng** — `ParticipantsSection` / `ParticipantsTable`: hiển thị danh sách participant (tên, avatar, role Leader/Member, status Joined/CheckedIn/Withdrawn/NoShow, joinedAt, checkedInAt) từ `GET .../participants`. Có thể làm bảng đơn giản, không cần phân trang phức tạp nếu `maxParticipants` thường ≤ 50.
  - Hiển thị thêm: meeting point (lat/lng + note) — có thể tái dùng `MeetingPointMapPicker.tsx` ở chế độ read-only/display nếu component đó hỗ trợ, hoặc chỉ hiện text tọa độ + link mở Google Maps.
- Action bar chỉ hiện Approve/Reject khi `status === 'PendingVerification'`. Khi `InProgress`/`OpenForJoin`/`JoinClosed` → chỉ xem, không có action (trừ khi muốn thêm nút Cancel — xem 3.4).
- Sau khi Approve/Reject thành công → điều hướng về trang queue + toast, giống hành vi `VerifyDetailClient` hiện tại.

### 3.4. Việc tùy chọn (hỏi lại trước khi làm)

- Nút "Hủy chương trình" (Cancel) trên trang detail — chưa chắc cần ngay, cân nhắc thêm sau nếu LEO có nhu cầu.
- Bộ lọc nâng cao ở trang queue (theo severity, theo office nếu LEO thuộc nhiều office, theo khoảng ngày) — mặc định chỉ cần lọc theo `status`.
- Real-time cập nhật (khi Leader vừa nộp verification, queue tự refresh) — có thể để polling đơn giản hoặc bỏ qua nếu portal chưa có realtime layer.

## 4. Thứ tự thực hiện đề xuất

1. Lớp API (models/dto/adapter/service/hook) — làm trước, không có UI phụ thuộc.
2. Trang Queue (`officer/community`) + nav item.
3. Trang Detail (ghép Progress + Participants + Verify actions).
4. Test luồng thật: tạo event → mobile Leader chạy hết luồng tới PendingVerification → LEO vào portal duyệt/từ chối → xác nhận report chuyển Resolved đúng.
5. (Nếu có thời gian) mục 3.4.

## 5. File tham khảo chính (đọc trước khi code)

- `components/officer/tracking/LeoTrackingReportDetail.tsx` — pattern progress ring + media timeline.
- `components/officer/verify/VerifyDetailClient.tsx` — pattern approve/reject + reject-reason dialog.
- `components/officer/assign/CreateCommunityCleanupDialog.tsx` + `hooks/useCommunityCleanup.ts` + `lib/api/services/fetchCommunityCleanup.ts` — convention hiện có của feature Community Cleanup, giữ đúng style khi mở rộng.
- Backend: `src/Greenlens.Application/Features/CommunityCleanup/Common/CommunityCleanupDtos.cs` — nguồn sự thật cho mọi field response.
