/** Nhãn + mô tả tiếng Việt — đọc title in đậm là hiểu ngay. */

export type SystemSettingDisplayMeta = {
  label: string;
  detail: string;
};

/** Map tường minh — ưu tiên cao nhất. */
export const SYSTEM_SETTING_DISPLAY: Record<string, SystemSettingDisplayMeta> = {
  submit_max_per_hour: {
    label: 'Giới hạn gửi báo cáo mỗi giờ',
    detail:
      'Mỗi tài khoản chỉ được gửi tối đa N báo cáo trong vòng 60 phút. Vượt ngưỡng có thể bị chặn tạm hoặc hiện trong bảng "Nghi spam". Trang Nghi spam cũng dùng giá trị này khi bạn không tự nhập ngưỡng riêng.',
  },
  submit_lock_seconds: {
    label: 'Thời gian chờ giữa hai lần gửi (giây)',
    detail:
      'Sau mỗi lần gửi báo cáo, tài khoản phải chờ N giây mới được gửi tiếp — chặn spam liên tục trong vài phút. Mặc định thường 3600 giây (1 giờ).',
  },
  submit_max_per_day: {
    label: 'Giới hạn gửi báo cáo mỗi ngày',
    detail:
      'Mỗi tài khoản chỉ được gửi tối đa N báo cáo trong 24 giờ (theo múi giờ hệ thống). Vượt ngưỡng có thể bị chặn đến hết ngày hoặc xuất hiện trên bảng Nghi spam.',
  },

  audit_log_retention_months: {
    label: 'Thời gian lưu nhật ký kiểm tra (tháng)',
    detail:
      'Bản ghi audit (ai đăng nhập, ai đổi cấu hình, ai duyệt báo cáo…) được giữ N tháng trước khi hệ thống xóa tự động. Phục vụ truy vết và tuân thủ BR-DAT.',
  },
  media_retention_years: {
    label: 'Thời gian lưu ảnh/video báo cáo (năm)',
    detail:
      'Ảnh và video công dân đính kèm báo cáo được lưu trên hệ thống tối đa N năm. Hết hạn, file có thể bị xóa hoặc chuyển lưu trữ lạnh tùy chính sách backend.',
  },
  status_history_retention_months: {
    label: 'Thời gian lưu lịch sử trạng thái (tháng)',
    detail:
      'Chuỗi đổi trạng thái báo cáo (Submitted → Verified → …) được giữ N tháng để tra cứu minh bạch. Quá hạn, bản ghi cũ có thể bị tóm tắt hoặc xóa.',
  },

  inspection_evidence_max_per_request: {
    label: 'Số ảnh minh chứng tối đa mỗi lần gửi',
    detail:
      'Cán bộ thanh tra đính kèm tối đa N ảnh hiện trường mỗi lần cập nhật kết quả thanh tra. Vượt ngưỡng phải gửi thêm trong lần upload sau.',
  },
  inspection_sla_resolve_days_critical: {
    label: 'Hạn xử lý thanh tra — mức rất nghiêm trọng (ngày)',
    detail:
      'Báo cáo thanh tra mức Critical phải được giải quyết trong N ngày kể từ khi ghi nhận. Quá hạn hiện cảnh báo trên dashboard và có thể gửi thông báo cho cán bộ.',
  },
  inspection_sla_resolve_days_high: {
    label: 'Hạn xử lý thanh tra — mức nghiêm trọng (ngày)',
    detail:
      'Báo cáo thanh tra mức High phải hoàn tất xử lý trong N ngày. Hạn ngắn hơn mức Medium/Low — phản ánh mức độ ưu tiên cao hơn.',
  },
  inspection_sla_resolve_days_medium: {
    label: 'Hạn xử lý thanh tra — mức trung bình (ngày)',
    detail:
      'Báo cáo thanh tra mức Medium có N ngày để xử lý trước khi bị coi là quá hạn. Thường dài hơn Critical/High nhưng ngắn hơn Low.',
  },
  inspection_sla_resolve_days_low: {
    label: 'Hạn xử lý thanh tra — mức nhẹ (ngày)',
    detail:
      'Báo cáo thanh tra mức Low được phép xử lý trong N ngày — hạn dài nhất trong bốn mức, phù hợp vụ việc ít khẩn cấp.',
  },

  auto_close_resolved_days: {
    label: 'Tự đóng báo cáo đã xử lý xong',
    detail:
      'Khi báo cáo ở trạng thái "đã xử lý xong", công dân có N ngày để xác nhận hoặc phản hồi. Hết thời hạn mà không có tương tác, hệ thống tự chuyển sang "đã đóng" và gửi thông báo theo mẫu tương ứng.',
  },
  draft_retention_days: {
    label: 'Số ngày giữ bản nháp',
    detail:
      'Bản nháp chưa gửi của công dân được lưu tối đa N ngày kể từ lần chỉnh sửa cuối. Quá hạn, bản nháp bị xóa tự động để giảm dữ liệu rác trên hệ thống.',
  },
  max_drafts_per_user: {
    label: 'Số bản nháp tối đa mỗi người',
    detail:
      'Một tài khoản chỉ được giữ tối đa N bản nháp cùng lúc. Muốn tạo thêm phải gửi hoặc xóa bản cũ — quy tắc nghiệp vụ khuyến nghị không quá 3.',
  },
  max_approved_reopens: {
    label: 'Số lần mở lại báo cáo tối đa',
    detail:
      'Một báo cáo đã đóng hoặc xử lý xong chỉ được cán bộ duyệt mở lại tối đa N lần trong vòng đời. Công dân gửi yêu cầu kèm minh chứng; cán bộ địa phương duyệt hoặc từ chối trên màn "Mở lại báo cáo".',
  },

  account_soft_delete_retention_days: {
    label: 'Giữ tài khoản đã xóa trước khi xóa hẳn',
    detail:
      'Sau khi người dùng tự xóa tài khoản, dữ liệu vẫn được giữ N ngày để có thể khôi phục hoặc đáp ứng yêu cầu lưu trữ pháp lý. Hết hạn, tài khoản và dữ liệu liên quan bị xóa vĩnh viễn.',
  },
  captcha_after_failed_attempts: {
    label: 'Hiện CAPTCHA sau N lần đăng nhập sai',
    detail:
      'Từ lần nhập sai thứ N trở đi (email/SĐT hoặc mật khẩu), màn hình đăng nhập bắt buộc xác minh CAPTCHA. Giúp chặn bot đoán mật khẩu hàng loạt mà vẫn cho phép người dùng thật thử lại.',
  },
  lockout_minutes: {
    label: 'Thời gian khóa tài khoản (phút)',
    detail:
      'Sau khi vượt "Số lần đăng nhập sai tối đa", tài khoản bị khóa tạm trong N phút — không đăng nhập, không gửi OTP. Hết thời gian khóa, người dùng thử lại bình thường.',
  },
  max_failed_login_attempts: {
    label: 'Số lần đăng nhập sai tối đa',
    detail:
      'Cho phép nhập sai email/SĐT hoặc mật khẩu tối đa N lần liên tiếp trước khi kích hoạt khóa tài khoản. Đếm theo tài khoản, không theo thiết bị.',
  },
  otp_max_attempts: {
    label: 'Số lần nhập OTP sai tối đa',
    detail:
      'Khi đăng ký, quên mật khẩu hoặc xác minh SĐT, người dùng nhập mã OTP sai quá N lần thì mã hiện tại hết hiệu lực — phải bấm "Gửi lại mã" và chờ mã mới.',
  },

  sla_verify_hours: {
    label: 'Hạn xác minh báo cáo (giờ)',
    detail:
      'Cán bộ môi trường cần xác minh báo cáo mới trong N giờ kể từ khi công dân gửi. Số giờ này cũng được chèn vào nội dung thông báo và cảnh báo quá hạn trên bảng điều khiển.',
  },
  overdue_pending_hours: {
    label: 'Coi là quá hạn sau (giờ)',
    detail:
      'Báo cáo vẫn "chờ xử lý" quá N giờ sẽ được đánh dấu quá hạn trên dashboard quản trị và cán bộ. Thông báo cảnh báo (vd. "quá 72 giờ") lấy số giờ từ đây.',
  },
  report_unassigned_hours: {
    label: 'Cảnh báo chưa giao đội dọn',
    detail:
      'Báo cáo đã xác minh nhưng chưa gán đội dọn dẹp sau N giờ sẽ kích hoạt cảnh báo cho cán bộ địa phương — tránh báo cáo bị bỏ quên sau bước xác minh.',
  },
  contract_warning_days: {
    label: 'Cảnh báo hợp đồng sắp hết hạn',
    detail:
      'Hệ thống gửi cảnh báo trước N ngày khi hợp đồng công ty môi trường sắp hết hạn, để quản trị viên và cán bộ chủ động gia hạn hoặc chuyển đội xử lý.',
  },

  flag_notify_threshold: {
    label: 'Ngưỡng gắn cờ để thông báo',
    detail:
      'Khi đủ N công dân khác "gắn cờ" cùng một báo cáo (nghi spam, sai sự thật…), cán bộ địa phương nhận thông báo để xem xét ẩn hoặc xử lý báo cáo đó.',
  },
  ai_flag_notify_threshold: {
    label: 'Ngưỡng cảnh báo gắn cờ tự động',
    detail:
      'Khi có đủ N báo cáo bị AI đánh dấu nghi ngờ (lạm dụng, không liên quan…), hệ thống gửi cảnh báo tập trung cho cán bộ — trước khi số lượng vượt kiểm soát.',
  },
  ai_flag_min_confidence: {
    label: 'Độ tin cậy tối thiểu của AI gắn cờ',
    detail:
      'AI chỉ tự gắn cờ báo cáo khi điểm tin cậy đạt từ 0 đến 1 (vd. 0,85 = 85%). Giá trị cao hơn → ít báo cáo bị gắn cờ nhưng chính xác hơn; thấp hơn → nhạy hơn nhưng dễ báo nhầm.',
  },
  ai_compare_timeout_seconds: {
    label: 'Thời gian chờ AI so sánh ảnh (giây)',
    detail:
      'Khi gửi ảnh before/after để AI đối chiếu, client chờ tối đa N giây cho kết quả. Quá thời gian, UI báo lỗi hoặc cho phép thử lại — tránh treo màn hình vô hạn.',
  },
  ai_temp_image_ttl_seconds: {
    label: 'Thời gian lưu ảnh tạm cho AI (giây)',
    detail:
      'Ảnh upload phục vụ phân tích AI được giữ trên storage tạm N giây trước khi tự xóa. Mặc định thường 900 giây (15 phút) — đủ cho pipeline xử lý mà không tích lũy file rác.',
  },
  ai_timeout_seconds: {
    label: 'Thời gian chờ phản hồi AI (giây)',
    detail:
      'Mọi gọi dịch vụ AI (gợi ý loại ô nhiễm, gắn cờ nghi ngờ…) bị timeout sau N giây. Hết hạn, FE hiển thị thất bại và cán bộ vẫn quyết định thủ công theo BR-AI-005.',
  },
  presign_upload_ttl_minutes: {
    label: 'Thời hạn URL upload ảnh (phút)',
    detail:
      'Link presigned (S3/CDN) để client upload ảnh/video báo cáo có hiệu lực N phút. Quá hạn phải xin link mới — tránh URL upload bị lộ dùng lâu.',
  },

  escalation_reason_min_length: {
    label: 'Độ dài lý do leo thang tối thiểu (ký tự)',
    detail:
      'Khi cán bộ leo thang nhiệm vụ dọn dẹp (Escalated), ô lý do bắt buộc nhập ít nhất N ký tự — tránh ghi chú sơ sài như "ok" hoặc "..." không có giá trị xử lý.',
  },
  reject_reason_min_length: {
    label: 'Độ dài lý do từ chối báo cáo tối thiểu (ký tự)',
    detail:
      'Cán bộ từ chối (Rejected) báo cáo phải giải thích tối thiểu N ký tự để công dân hiểu vì sao bị từ chối. Khác với "Số lần mở lại báo cáo tối đa" ở module Vòng đời.',
  },
  reopen_reason_min_length: {
    label: 'Độ dài lý do yêu cầu mở lại tối thiểu (ký tự)',
    detail:
      'Công dân gửi yêu cầu mở lại báo cáo đã đóng phải nêu lý do và minh chứng với ít nhất N ký tự — giúp cán bộ đánh giá có cơ sở trước khi duyệt.',
  },

  duplicate_max_candidates: {
    label: 'Số báo cáo trùng gợi ý khi gửi',
    detail:
      'Lúc công dân gửi báo cáo mới, hệ thống quét các báo cáo gần đó và hiển thị tối đa N báo cáo có thể trùng để người dùng chọn "gộp vào báo cáo có sẵn" thay vì tạo trùng.',
  },
  duplicate_merge_points_ratio: {
    label: 'Tỷ lệ điểm khi gộp báo cáo trùng',
    detail:
      'Khi báo cáo bị gộp vào bản chính, người gửi nhận phần điểm thưởng = tỷ lệ này × điểm đầy đủ (0 = không điểm, 1 = đủ điểm, 0,5 = một nửa).',
  },
  duplicate_radius_meters: {
    label: 'Khoảng cách coi là trùng (mét)',
    detail:
      'Hai báo cáo cách nhau không quá N mét (và cùng loại ô nhiễm) có thể được gợi ý là trùng ở bước gửi báo cáo. Bán kính càng lớn, càng dễ phát hiện trùng nhưng dễ gộp nhầm.',
  },

  map_default_detail_limit: {
    label: 'Số điểm tối đa khi phóng to bản đồ',
    detail:
      'Chế độ chi tiết (detail): mỗi lần kéo hoặc zoom bản đồ công khai, API trả tối đa N báo cáo dạng ghim. Giá trị cao hơn thì thấy nhiều điểm hơn nhưng dễ làm chậm trình duyệt ở khu vực đông.',
  },
  map_default_aggregate_limit: {
    label: 'Số ô gom tối đa khi thu nhỏ bản đồ',
    detail:
      'Chế độ gom cụm (aggregate): khi thu nhỏ bản đồ, các báo cáo gần nhau được gộp thành ô — tối đa N ô hiển thị mỗi lần tải. Giúp bản đồ mượt khi có hàng nghìn báo cáo.',
  },
  map_default_grid_level: {
    label: 'Mức lưới gom cụm mặc định',
    detail:
      'Độ chia lưới khi gom cụm: số càng lớn thì ô càng nhỏ, chi tiết hơn nhưng server phải xử lý nhiều hơn. Mặc định thường là 3; BE thường cho phép từ 1 đến 10 tùy mức zoom.',
  },
  map_max_aggregate_rows: {
    label: 'Số ô gom tối đa mỗi lần truy vấn',
    detail:
      'Trần cứng số ô cụm (cells) API được phép trả về trong một lần gọi chế độ aggregate. Khác với "Số ô gom tối đa khi thu nhỏ" — đây là giới hạn tuyệt đối phía server, thường rất lớn (hàng chục nghìn).',
  },
  map_max_bounding_lat_span: {
    label: 'Chiều cao vùng quét tối đa (vĩ độ, độ)',
    detail:
      'Giới hạn (maxLat − minLat) tối đa mỗi lần người dùng yêu cầu dữ liệu bản đồ, tính bằng độ vĩ đế. Chặn zoom quá xa (vd. cả miền Bắc–Nam) trong một request — bảo vệ hiệu năng API.',
  },
  map_max_bounding_lng_span: {
    label: 'Chiều ngang vùng quét tối đa (kinh độ, độ)',
    detail:
      'Giới hạn (maxLng − minLng) tối đa mỗi lần truy vấn, tính bằng độ kinh độ. Thường lớn hơn vĩ độ vì Việt Nam dài theo hướng Bắc–Nam; vẫn ngăn quét vùng quá rộng một lúc.',
  },
  map_summary_default_days: {
    label: 'Số ngày thống kê trên bản đồ',
    detail:
      'API tóm tắt (summary) đếm báo cáo công khai trong vùng nhìn thấy trong N ngày gần nhất — dùng cho biểu đồ trang chủ và panel thống kê. Mặc định thường 30 ngày.',
  },
  map_min_refresh_interval_seconds: {
    label: 'Thời gian chờ giữa hai lần tải lại bản đồ (giây)',
    detail:
      'Khoảng cách tối thiểu giữa hai lần client gọi lại API bản đồ khi người dùng kéo hoặc zoom liên tục. Giảm tải server và tuân quy tắc giới hạn làm mới bản đồ (BR-MAP-012).',
  },
  nearby_report_radius_km: {
    label: 'Bán kính tìm báo cáo gần (kilômét)',
    detail:
      'Phạm vi quét các báo cáo lân cận quanh vị trí công dân trên bản đồ (mặc định thường 5 km). Dùng cho hiển thị bản đồ, không nhầm với bán kính gửi push "Báo cáo gần bạn" (cấu hình ở module Thông báo, đơn vị mét).',
  },

  max_notifications_per_type_per_day: {
    label: 'Giới hạn thông báo mỗi loại mỗi ngày',
    detail:
      'Mỗi tài khoản chỉ nhận tối đa N thông báo cùng một loại (vd. đổi trạng thái báo cáo, bình luận mới, báo cáo gần bạn) trong 24 giờ. Giảm spam push/email theo quy tắc BR-NTF.',
  },
  nearby_report_max_recipients: {
    label: 'Số người nhận thông báo báo cáo gần',
    detail:
      'Khi có báo cáo ô nhiễm mới, hệ thống gửi thông báo "Báo cáo gần bạn" cho tối đa N công dân ở gần nhất (trong bán kính quy định). Ưu tiên người gần điểm báo cáo nhất.',
  },
  nearby_report_radius_meters: {
    label: 'Bán kính gửi thông báo báo cáo gần (mét)',
    detail:
      'Chỉ công dân nằm trong vòng N mét quanh vị trí báo cáo mới được xét nhận push NearbyReport. Mặc định 2000 m (2 km); khác với bán kính quét bản đồ tính bằng kilômét.',
  },

  comment_max_per_hour: {
    label: 'Giới hạn bình luận mỗi giờ',
    detail:
      'Mỗi tài khoản chỉ được đăng tối đa N bình luận trên các báo cáo trong một giờ — hạn chế spam, quảng cáo hoặc toxic comment trên diễn đàn cộng đồng.',
  },
  comment_ban_duration_days: {
    label: 'Thời gian cấm bình luận (ngày)',
    detail:
      'Khi cán bộ hoặc hệ thống khóa quyền bình luận (vi phạm nội quy, spam), tài khoản bị cấm đăng bình luận trong N ngày. Hết hạn mới được bình luận lại trên báo cáo công khai.',
  },
  comment_edit_window_minutes: {
    label: 'Thời gian cho phép sửa bình luận (phút)',
    detail:
      'Sau khi đăng bình luận, công dân có tối đa N phút để chỉnh sửa nội dung hoặc sửa lỗi chính tả. Quá thời hạn, bình luận khóa chỉnh sửa — chỉ có thể xóa (nếu được phép) hoặc để nguyên.',
  },

  invitation_response_days: {
    label: 'Thời hạn phản hồi lời mời tham gia (ngày)',
    detail:
      'Khi cán bộ hoặc quản trị mời thành viên vào phường/đội, người được mời phải chấp nhận hoặc từ chối trong N ngày. Quá hạn, lời mời hết hiệu lực và cần gửi lại.',
  },
  max_tasks_per_team: {
    label: 'Số nhiệm vụ tối đa mỗi đội',
    detail:
      'Mỗi đội dọn dẹp chỉ được nhận tối đa N báo cáo đang xử lý cùng lúc. Cán bộ gán thêm việc vượt ngưỡng sẽ bị cảnh báo workload — tránh quá tải một đội.',
  },
  staff_invitation_expiry_days: {
    label: 'Thời hạn hiệu lực lời mời nhân sự (ngày)',
    detail:
      'Link hoặc email mời cán bộ, nhân viên công ty tham gia hệ thống có hiệu lực N ngày kể từ khi gửi. Hết hạn mà chưa kích hoạt tài khoản thì phải tạo lời mời mới.',
  },
  team_workload_warning_threshold: {
    label: 'Ngưỡng cảnh báo tải công việc đội',
    detail:
      'Khi số nhiệm vụ đang mở của một đội đạt N (hoặc vượt), dashboard cán bộ và công ty hiện cảnh báo trước khi gán thêm việc — giúp cân bằng khối lượng giữa các đội.',
  },

  check_in_reminder_minutes_before_start: {
    label: 'Nhắc check-in trước giờ bắt đầu (phút)',
    detail:
      'Trước giờ hẹn dọn cộng đồng N phút, hệ thống gửi push/nhắc tình nguyện viên mở app và check-in GPS tại điểm tập trung. Giảm vắng mặt khi sự kiện bắt đầu.',
  },
  community_before_images_max: {
    label: 'Số ảnh hiện trường tối đa (trước dọn)',
    detail:
      'Khi báo cáo tiến độ dọn cộng đồng, tình nguyện viên được đính kèm tối đa N ảnh "trước khi dọn" để minh chứng hiện trạng. Vượt ngưỡng phải gửi thêm trong lần cập nhật sau.',
  },

  priority_reporter_count_weight: {
    label: 'Ưu tiên báo cáo nhiều người gửi',
    detail:
      'Càng nhiều công dân báo cùng một điểm ô nhiễm, báo cáo càng được cộng điểm ưu tiên và xếp lên đầu hàng đợi cán bộ. Số càng lớn, yếu tố "nhiều người báo" càng quan trọng.',
  },
  priority_severity_weight: {
    label: 'Ưu tiên theo mức độ nghiêm trọng',
    detail:
      'Báo cáo mức "rất nghiêm trọng" hoặc "nghiêm trọng" được xếp trước báo cáo nhẹ hơn trong hàng đợi cán bộ. Số càng lớn, mức độ nghiêm trọng càng ảnh hưởng mạnh đến thứ tự xử lý.',
  },
  priority_sla_verify_breach_boost: {
    label: 'Đẩy lên đầu khi trễ hạn xác minh',
    detail:
      'Nếu báo cáo đã quá "Hạn xác minh" mà chưa được cán bộ xử lý, cộng thêm N điểm ưu tiên để nổi bật trên đầu danh sách — báo hiệu cần xử lý gấp.',
  },
  priority_sla_resolve_breach_boost: {
    label: 'Đẩy lên đầu khi trễ hạn xử lý',
    detail:
      'Báo cáo quá hạn giải quyết hoặc dọn dẹp (sau bước xác minh) được cộng thêm điểm ưu tiên — tránh các vụ ô nhiễm nghiêm trọng bị trễ quá lâu.',
  },
  priority_age_weight: {
    label: 'Ưu tiên báo cáo chờ lâu',
    detail:
      'Báo cáo nằm trong hàng đợi càng lâu thì càng được cộng điểm ưu tiên theo thời gian — đảm bảo vụ cũ không bị "chìm" dưới vụ mới liên tục.',
  },
  priority_wait_time_weight: {
    label: 'Ưu tiên theo thời gian chờ',
    detail:
      'Tương tự "chờ lâu", nhưng tính theo thời gian chờ tích lũy giữa các mốc trạng thái. Số càng lớn, báo cáo tồn đọng càng nhanh được đẩy lên.',
  },

  check_in_max_distance_meters: {
    label: 'Khoảng cách check-in tối đa (mét)',
    detail:
      'Đội dọn dẹp hoặc người tham gia chương trình cộng đồng phải đứng trong vòng N mét so với điểm báo cáo mới được xác nhận có mặt (check-in). Mặc định 200 mét theo quy tắc nghiệp vụ; tăng quá cao dễ gian lận vị trí.',
  },
  progress_update_max_distance_meters: {
    label: 'Khoảng cách tối đa khi cập nhật tiến độ (mét)',
    detail:
      'Khi trưởng đội dọn, đội thanh tra hoặc community lead nộp ảnh tiến độ hoặc hoàn thành công việc, hệ thống so sánh GPS lúc chụp với vị trí hiện trường. Vượt quá N mét thì request bị chặn và mobile hiển thị cảnh báo — độc lập với ngưỡng check-in ban đầu.',
  },
  exif_gps_mismatch_meters: {
    label: 'Sai lệch GPS ảnh và thiết bị (mét)',
    detail:
      'Khi gửi báo cáo kèm ảnh, hệ thống so sánh tọa độ GPS trong file ảnh (EXIF) với GPS thiết bị lúc chụp. Lệch quá N mét có thể bị cảnh báo hoặc từ chối — chống dùng ảnh cũ hoặc ảnh chụp xa hiện trường.',
  },
  inspection_soft_gps_meters: {
    label: 'Ngưỡng lệch GPS khi thanh tra (mét)',
    detail:
      'Cán bộ thanh tra ghi nhận vị trí hiện trường, cho phép lệch tối đa N mét so với tọa độ báo cáo gốc mà vẫn được coi là đúng điểm. Hữu ích khi GPS dao động trong nhà hoặc khu vực cao tầng đông đúc.',
  },

  decline_window_hours: {
    label: 'Thời hạn được phép từ chối nhiệm vụ (giờ)',
    detail:
      'Sau khi cán bộ gán báo cáo cho công ty môi trường, đội dọn có tối đa N giờ để chấp nhận hoặc từ chối (Declined) kèm lý do. Hết thời hạn mà chưa phản hồi, cán bộ được nhắc giao lại hoặc xử lý tiếp.',
  },
  progress_escalate_hours: {
    label: 'Leo thang khi không cập nhật tiến độ (giờ)',
    detail:
      'Đội đã nhận việc nhưng không gửi cập nhật tiến độ (ảnh, phần trăm hoàn thành) trong N giờ thì báo cáo chuyển sang trạng thái Escalated. Cán bộ và quản trị công ty nhận thông báo cần can thiệp.',
  },
  progress_stale_hours: {
    label: 'Coi tiến độ là cũ sau (giờ)',
    detail:
      'Không có cập nhật tiến độ mới trong N giờ thì hệ thống đánh dấu nhiệm vụ "treo" trên dashboard công ty và cán bộ — cảnh báo sớm trước khi leo thang (Escalated).',
  },
  progress_update_interval_hours: {
    label: 'Chu kỳ nhắc cập nhật tiến độ (giờ)',
    detail:
      'Khi đang dọn dẹp, đội được nhắc gửi tiến độ (ảnh hiện trường, ghi chú, phần trăm) ít nhất mỗi N giờ. Giúp cán bộ và công dân theo dõi tiến độ xử lý ô nhiễm minh bạch.',
  },

  vietnam_min_latitude: {
    label: 'Vĩ độ nam nhất cho vị trí hợp lệ',
    detail:
      'Công dân chỉ gửi được báo cáo có GPS nằm trong lãnh thổ Việt Nam. Đây là ranh giới phía nam — tọa độ thấp hơn giá trị này sẽ bị từ chối khi gửi.',
  },
  vietnam_max_latitude: {
    label: 'Vĩ độ bắc nhất cho vị trí hợp lệ',
    detail:
      'Ranh giới phía bắc của vùng GPS hợp lệ tại Việt Nam. Báo cáo có vĩ độ cao hơn ngưỡng này (ngoài biên giới) sẽ không được chấp nhận.',
  },
  vietnam_min_longitude: {
    label: 'Kinh độ tây nhất cho vị trí hợp lệ',
    detail:
      'Ranh giới phía tây — kinh độ nhỏ hơn giá trị này coi là ngoài lãnh thổ, báo cáo bị từ chối. Thường giữ nguyên theo seed hệ thống, không cần chỉnh tay.',
  },
  vietnam_max_longitude: {
    label: 'Kinh độ đông nhất cho vị trí hợp lệ',
    detail:
      'Ranh giới phía đông của vùng cho phép. Dùng cùng bộ giới hạn vĩ/kinh độ để validate GPS mọi báo cáo công dân gửi lên.',
  },
};

/** Từ khóa kỹ thuật → tiếng Việt (fallback suy luận label). */
const TOKEN_VI: Record<string, string> = {
  auto: 'tự động',
  close: 'đóng',
  resolved: 'đã xử lý xong',
  closed: 'đã đóng',
  draft: 'bản nháp',
  retention: 'lưu giữ',
  captcha: 'CAPTCHA',
  lockout: 'khóa tài khoản',
  failed: 'sai',
  login: 'đăng nhập',
  attempts: 'lần thử',
  otp: 'OTP',
  minutes: 'phút',
  account: 'tài khoản',
  soft: 'tạm',
  delete: 'xóa',
  duplicate: 'trùng lặp',
  merge: 'gộp',
  points: 'điểm',
  ratio: 'tỷ lệ',
  radius: 'bán kính',
  meters: 'mét',
  candidates: 'ứng viên',
  max: 'tối đa',
  min: 'tối thiểu',
  submit: 'gửi',
  per: 'mỗi',
  hour: 'giờ',
  hours: 'giờ',
  days: 'ngày',
  map: 'bản đồ',
  default: 'mặc định',
  detail: 'chi tiết',
  aggregate: 'gom cụm',
  grid: 'lưới',
  level: 'mức',
  bounding: 'vùng giới hạn',
  span: 'độ rộng',
  rows: 'dòng',
  lat: 'vĩ độ',
  lng: 'kinh độ',
  summary: 'thống kê',
  refresh: 'tải lại',
  interval: 'chu kỳ',
  seconds: 'giây',
  limit: 'giới hạn',
  nearby: 'gần',
  report: 'báo cáo',
  reports: 'báo cáo',
  sla: 'hạn xử lý',
  verify: 'xác minh',
  overdue: 'quá hạn',
  pending: 'chờ xử lý',
  unassigned: 'chưa giao việc',
  contract: 'hợp đồng',
  warning: 'cảnh báo',
  flag: 'gắn cờ',
  notify: 'thông báo',
  notification: 'thông báo',
  notifications: 'thông báo',
  recipients: 'người nhận',
  type: 'loại',
  threshold: 'ngưỡng',
  ai: 'tự động',
  spam: 'rác thông tin',
  rate: 'tốc độ',
  vietnam: 'Việt Nam',
  latitude: 'vĩ độ',
  longitude: 'kinh độ',
  user: 'người dùng',
  users: 'người dùng',
  comment: 'bình luận',
  photo: 'ảnh',
  photos: 'ảnh',
  video: 'video',
  cleanup: 'dọn dẹp',
  decline: 'từ chối',
  window: 'thời hạn',
  escalate: 'leo thang',
  stale: 'cũ',
  progress: 'tiến độ',
  update: 'cập nhật',
  community: 'cộng đồng',
  hotspot: 'điểm nóng',
  reopen: 'mở lại',
  reopens: 'mở lại',
  approved: 'được duyệt',
  confidence: 'độ tin cậy',
  comments: 'bình luận',
  reject: 'từ chối',
  rejected: 'bị từ chối',
  enable: 'bật',
  enabled: 'bật',
  disable: 'tắt',
  km: 'kilômét',
  priority: 'ưu tiên',
  weight: 'mức ảnh hưởng',
  boost: 'cộng thêm',
  severity: 'mức nghiêm trọng',
  reporter: 'người báo cáo',
  count: 'số lượng',
  score: 'điểm',
  breach: 'vi phạm hạn',
  resolve: 'giải quyết',
  age: 'thời gian chờ',
  wait: 'chờ',
  time: 'thời gian',
  tier: 'mức',
  placeholder: 'vị trí thay thế',
  template: 'mẫu thông báo',
  lifecycle: 'vòng đời',
  geo: 'địa lý',
  bounds: 'ranh giới',
  check: 'check-in',
  exif: 'dữ liệu ảnh',
  gps: 'GPS',
  mismatch: 'sai lệch',
  invitation: 'lời mời',
  response: 'phản hồi',
  expiry: 'hết hạn',
  staff: 'nhân sự',
  team: 'đội',
  teams: 'đội',
  tasks: 'nhiệm vụ',
  task: 'nhiệm vụ',
  workload: 'khối lượng công việc',
  ban: 'cấm',
  duration: 'thời gian',
  edit: 'chỉnh sửa',
  reminder: 'nhắc nhở',
  before: 'trước',
  start: 'bắt đầu',
  images: 'ảnh',
  image: 'ảnh',
  in: 'tại',
  inspection: 'thanh tra',
  evidence: 'minh chứng',
  audit: 'nhật ký kiểm tra',
  log: 'nhật ký',
  media: 'ảnh/video',
  status: 'trạng thái',
  history: 'lịch sử',
  months: 'tháng',
  month: 'tháng',
  years: 'năm',
  year: 'năm',
  day: 'ngày',
  lock: 'chờ',
  request: 'lần gửi',
  critical: 'rất nghiêm trọng',
  high: 'nghiêm trọng',
  medium: 'trung bình',
  low: 'nhẹ',
  compare: 'so sánh',
  timeout: 'chờ phản hồi',
  temp: 'tạm',
  ttl: 'hết hạn',
  presign: 'URL upload',
  upload: 'tải lên',
  escalation: 'leo thang',
  reason: 'lý do',
  length: 'độ dài',
  distance: 'khoảng cách',
};

function translateTokens(parts: string[]): string {
  const translated = parts.map(p => TOKEN_VI[p]).filter((v): v is string => Boolean(v?.trim()));
  if (translated.length === 0) return '';
  return translated.join(' ').replace(/\s+/g, ' ').trim();
}

/** Suy luận label tiếng Việt từ key khi chưa có map. */
export function inferSystemSettingLabel(key: string): string {
  const k = key.toLowerCase();
  const parts = k.split('_').filter(Boolean);
  if (parts.length === 0) return 'Thiết lập hệ thống';

  const last = parts[parts.length - 1];
  const body = parts.slice(0, -1);

  if (last === 'threshold') {
    if (k === 'team_workload_warning_threshold') {
      return 'Ngưỡng cảnh báo tải công việc đội';
    }
    const bodyText = translateTokens(body);
    return bodyText ? `Ngưỡng ${bodyText}` : 'Ngưỡng cấu hình';
  }
  if (last === 'limit') {
    const bodyText = translateTokens(body);
    return bodyText ? `Giới hạn ${bodyText}` : 'Giới hạn cấu hình';
  }
  if (last === 'hours') {
    if (k === 'decline_window_hours') return 'Thời hạn được phép từ chối nhiệm vụ (giờ)';
    if (k === 'progress_escalate_hours') return 'Leo thang khi không cập nhật tiến độ (giờ)';
    if (k === 'progress_stale_hours') return 'Coi tiến độ là cũ sau (giờ)';
    if (k === 'progress_update_interval_hours') return 'Chu kỳ nhắc cập nhật tiến độ (giờ)';
    const bodyText = translateTokens(body);
    return bodyText ? `Thời hạn ${bodyText} (giờ)` : 'Thời hạn (giờ)';
  }
  if (last === 'days') {
    if (k === 'comment_ban_duration_days') return 'Thời gian cấm bình luận (ngày)';
    if (k === 'invitation_response_days') return 'Thời hạn phản hồi lời mời tham gia (ngày)';
    if (k === 'staff_invitation_expiry_days') return 'Thời hạn hiệu lực lời mời nhân sự (ngày)';
    const bodyText = translateTokens(body);
    return bodyText ? `Thời hạn ${bodyText} (ngày)` : 'Thời hạn (ngày)';
  }
  if (last === 'day') {
    if (k === 'submit_max_per_day') return 'Giới hạn gửi báo cáo mỗi ngày';
    const bodyText = translateTokens(body);
    return bodyText ? `Giới hạn ${bodyText} mỗi ngày` : 'Giới hạn mỗi ngày';
  }
  if (last === 'seconds') {
    if (k === 'submit_lock_seconds') return 'Thời gian chờ giữa hai lần gửi (giây)';
    if (k === 'ai_compare_timeout_seconds') return 'Thời gian chờ AI so sánh ảnh (giây)';
    if (k === 'ai_temp_image_ttl_seconds') return 'Thời gian lưu ảnh tạm cho AI (giây)';
    if (k === 'ai_timeout_seconds') return 'Thời gian chờ phản hồi AI (giây)';
    const bodyText = translateTokens(body);
    return bodyText ? `Thời gian ${bodyText} (giây)` : 'Thời gian (giây)';
  }
  if (last === 'months') {
    if (k === 'audit_log_retention_months') return 'Thời gian lưu nhật ký kiểm tra (tháng)';
    if (k === 'status_history_retention_months') return 'Thời gian lưu lịch sử trạng thái (tháng)';
    const bodyText = translateTokens(body);
    return bodyText ? `Thời gian lưu ${bodyText} (tháng)` : 'Thời gian lưu (tháng)';
  }
  if (last === 'years') {
    if (k === 'media_retention_years') return 'Thời gian lưu ảnh/video báo cáo (năm)';
    const bodyText = translateTokens(body);
    return bodyText ? `Thời gian lưu ${bodyText} (năm)` : 'Thời gian lưu (năm)';
  }
  if (last === 'minutes') {
    if (k === 'comment_edit_window_minutes') return 'Thời gian cho phép sửa bình luận (phút)';
    if (k === 'presign_upload_ttl_minutes') return 'Thời hạn URL upload ảnh (phút)';
    const bodyText = translateTokens(body);
    return bodyText ? `Thời gian ${bodyText} (phút)` : 'Thời gian (phút)';
  }
  if (last === 'length' && k.endsWith('_min_length')) {
    if (k.startsWith('escalation_reason')) return 'Độ dài lý do leo thang tối thiểu (ký tự)';
    if (k.startsWith('reject_reason')) return 'Độ dài lý do từ chối báo cáo tối thiểu (ký tự)';
    if (k.startsWith('reopen_reason')) return 'Độ dài lý do yêu cầu mở lại tối thiểu (ký tự)';
    const bodyText = translateTokens(body.filter(p => p !== 'min'));
    return bodyText ? `Độ dài ${bodyText} tối thiểu (ký tự)` : 'Độ dài tối thiểu (ký tự)';
  }
  if (last === 'attempts') {
    const bodyText = translateTokens(body);
    return bodyText ? `Số lần ${bodyText} tối đa` : 'Số lần thử tối đa';
  }
  if (parts[0] === 'max' && parts.length > 1) {
    if (k === 'max_notifications_per_type_per_day') {
      return 'Giới hạn thông báo mỗi loại mỗi ngày';
    }
    if (k === 'max_tasks_per_team') {
      return 'Số nhiệm vụ tối đa mỗi đội';
    }
    const bodyText = translateTokens(parts.slice(1));
    return bodyText ? `Giới hạn ${bodyText} tối đa` : 'Giới hạn tối đa';
  }
  if (parts[0] === 'min' && parts.length > 1) {
    const bodyText = translateTokens(parts.slice(1));
    return bodyText ? `Giá trị ${bodyText} tối thiểu` : 'Giá trị tối thiểu';
  }
  if (last === 'meters' && body[body.length - 1] === 'radius') {
    const prefix = translateTokens(body.slice(0, -1));
    return prefix ? `Bán kính ${prefix} (mét)` : 'Bán kính (mét)';
  }
  if (last === 'meters') {
    if (k === 'progress_update_max_distance_meters') {
      return 'Khoảng cách tối đa khi cập nhật tiến độ (mét)';
    }
    if (k.includes('check_in')) return 'Khoảng cách check-in tối đa (mét)';
    if (k.includes('exif_gps')) return 'Sai lệch GPS ảnh và thiết bị (mét)';
    if (k.includes('inspection')) return 'Ngưỡng lệch GPS khi thanh tra (mét)';
    if (k.includes('nearby_report_radius')) return 'Bán kính gửi thông báo báo cáo gần (mét)';
    const bodyText = translateTokens(body);
    return bodyText ? `Khoảng cách ${bodyText} (mét)` : 'Khoảng cách (mét)';
  }
  if (last === 'ratio') {
    const bodyText = translateTokens(body);
    return bodyText ? `Tỷ lệ ${bodyText}` : 'Tỷ lệ cấu hình';
  }
  if (last === 'km') {
    const bodyText = translateTokens(body);
    return bodyText ? `Khoảng cách ${bodyText} (kilômét)` : 'Khoảng cách (kilômét)';
  }
  if (last === 'weight' && parts[0] === 'priority') {
    const bodyText = translateTokens(body.slice(1));
    return bodyText ? `Mức ưu tiên theo ${bodyText}` : 'Mức ưu tiên xếp hàng';
  }
  if (last === 'boost' && parts[0] === 'priority') {
    const bodyText = translateTokens(body.slice(1));
    return bodyText ? `Cộng ưu tiên khi ${bodyText}` : 'Cộng thêm ưu tiên';
  }

  if (k.startsWith('map_')) {
    if (k.includes('grid_level')) return 'Mức lưới gom cụm mặc định';
    if (k.includes('aggregate_rows')) return 'Số ô gom tối đa mỗi lần truy vấn';
    if (k.includes('bounding_lat')) return 'Chiều cao vùng quét tối đa (vĩ độ, độ)';
    if (k.includes('bounding_lng')) return 'Chiều ngang vùng quét tối đa (kinh độ, độ)';
    if (k.includes('detail_limit')) return 'Số điểm tối đa khi phóng to bản đồ';
    if (k.includes('aggregate_limit')) return 'Số ô gom tối đa khi thu nhỏ bản đồ';
    if (k.includes('summary') && k.includes('days')) return 'Số ngày thống kê trên bản đồ';
    if (k.includes('refresh') && k.includes('seconds'))
      return 'Thời gian chờ tải lại bản đồ (giây)';
  }

  if (last === 'critical' || last === 'high' || last === 'medium' || last === 'low') {
    if (k.startsWith('inspection_sla_resolve_days_')) {
      if (last === 'critical') return 'Hạn xử lý thanh tra — mức rất nghiêm trọng (ngày)';
      if (last === 'high') return 'Hạn xử lý thanh tra — mức nghiêm trọng (ngày)';
      if (last === 'medium') return 'Hạn xử lý thanh tra — mức trung bình (ngày)';
      return 'Hạn xử lý thanh tra — mức nhẹ (ngày)';
    }
  }
  if (last === 'request') {
    if (k === 'inspection_evidence_max_per_request') {
      return 'Số ảnh minh chứng tối đa mỗi lần gửi';
    }
  }
  if (k === 'check_in_reminder_minutes_before_start') {
    return 'Nhắc check-in trước giờ bắt đầu (phút)';
  }
  if (k === 'community_before_images_max') {
    return 'Số ảnh hiện trường tối đa (trước dọn)';
  }

  if (k.startsWith('nearby_report_')) {
    if (k.includes('max_recipients')) {
      return 'Số người nhận thông báo báo cáo gần';
    }
    if (k.includes('radius_meters')) {
      return 'Bán kính gửi thông báo báo cáo gần (mét)';
    }
  }

  const full = translateTokens(parts);
  if (full) {
    return full.charAt(0).toUpperCase() + full.slice(1);
  }

  return 'Thiết lập hệ thống';
}

/** Suy luận dòng giải thích ngắn từ key — luôn tiếng Việt. */
export function inferSystemSettingDetail(key: string): string {
  const k = key.toLowerCase();

  if (k.includes('check_in') && k.includes('distance')) {
    return 'Bán kính cho phép đội dọn hoặc tình nguyện viên check-in tại hiện trường — ngoài vòng này hệ thống từ chối xác nhận có mặt.';
  }
  if (k.includes('progress_update') && k.includes('max_distance')) {
    return 'Ngưỡng GPS khi nộp ảnh tiến độ hoặc hoàn thành — vượt quá thì hệ thống chặn gửi và hiển thị cảnh báo trên mobile.';
  }
  if (k.includes('exif') && k.includes('gps')) {
    return 'Ngưỡng chênh lệch giữa vị trí GPS ghi trong ảnh và vị trí thiết bị — phát hiện ảnh không chụp tại hiện trường.';
  }
  if (k.includes('inspection') && k.includes('gps')) {
    return 'Ngưỡng lệch vị trí khi cán bộ thanh tra xác minh tại chỗ, tránh từ chối oan do GPS không ổn định.';
  }
  if (k.endsWith('_reason_min_length')) {
    if (k.startsWith('escalation_reason')) {
      return 'Số ký tự tối thiểu khi cán bộ ghi lý do leo thang nhiệm vụ — đảm bảo mô tả đủ chi tiết để xử lý tiếp.';
    }
    if (k.startsWith('reject_reason')) {
      return 'Số ký tự tối thiểu trong lý do từ chối báo cáo — công dân cần biết rõ căn cứ từ chối.';
    }
    if (k.startsWith('reopen_reason')) {
      return 'Số ký tự tối thiểu trong lý do công dân xin mở lại báo cáo — không nhầm với giới hạn số lần duyệt mở lại.';
    }
    return 'Số ký tự tối thiểu bắt buộc trong trường lý do trên form — tránh nội dung quá ngắn hoặc vô nghĩa.';
  }
  if (k.includes('max_approved_reopens') || k === 'max_approved_reopens') {
    return 'Giới hạn số lần cán bộ có thể duyệt mở lại một báo cáo đã đóng hoặc xử lý xong — công dân phải gửi yêu cầu kèm minh chứng.';
  }
  if (k.includes('reopen')) {
    return 'Quy tắc liên quan mở lại báo cáo đã đóng — số lần duyệt hoặc độ dài lý do công dân phải nêu.';
  }
  if (k === 'ai_compare_timeout_seconds') {
    return 'Giới hạn thời gian chờ kết quả AI đối chiếu ảnh before/after — tránh treo UI khi dịch vụ AI chậm.';
  }
  if (k === 'ai_temp_image_ttl_seconds') {
    return 'Thời gian file ảnh tạm được giữ trên server phục vụ pipeline AI trước khi tự dọn.';
  }
  if (k === 'ai_timeout_seconds') {
    return 'Timeout chung cho mọi request tới dịch vụ AI — Officer vẫn là người quyết định cuối khi AI không phản hồi kịp.';
  }
  if (k === 'presign_upload_ttl_minutes') {
    return 'Thời hạn link upload trực tiếp lên storage — không liên quan khóa tài khoản hay phiên đăng nhập.';
  }
  if (k.startsWith('ai_') && !k.includes('ai_flag')) {
    return 'Cấu hình timeout và lưu trữ tạm cho tích hợp AI — ảnh hưởng trải nghiệm gửi báo cáo và gợi ý tự động.';
  }
  if (k.includes('comment_ban')) {
    return 'Thời gian khóa quyền bình luận khi vi phạm nội quy cộng đồng — hết hạn mới đăng lại được.';
  }
  if (k.includes('comment_edit')) {
    return 'Cửa sổ thời gian công dân được sửa bình luận vừa đăng — quá hạn chỉ xem hoặc xóa, không chỉnh nội dung.';
  }
  if (k.includes('comment_max')) {
    return 'Giới hạn tần suất bình luận của công dân trên báo cáo — chống spam và nội dung độc hại trên diễn đàn cộng đồng.';
  }
  if (k.includes('invitation_response')) {
    return 'Thời hạn người được mời phải chấp nhận hoặc từ chối trước khi lời mời vào phường/đội hết hiệu lực.';
  }
  if (k.includes('staff_invitation')) {
    return 'Số ngày link mời nhân sự (cán bộ, nhân viên công ty) còn dùng được trước khi phải gửi lại.';
  }
  if (k.includes('max_tasks_per_team')) {
    return 'Trần số báo cáo một đội dọn có thể nhận đồng thời — tránh giao quá nhiều việc cho cùng một đội.';
  }
  if (k.includes('team_workload')) {
    return 'Khi đội đang xử lý đủ N việc, hệ thống cảnh báo trước khi cán bộ gán thêm — cân bằng workload giữa các đội.';
  }
  if (k.includes('check_in_reminder')) {
    return 'Gửi nhắc nhở cho tình nguyện viên trước giờ hẹn dọn cộng đồng để kịp check-in GPS tại điểm tập trung.';
  }
  if (k.includes('community_before_images')) {
    return 'Giới hạn số ảnh minh chứng hiện trạng trước khi dọn trong báo cáo tiến độ chương trình cộng đồng.';
  }
  if (k.includes('comment')) {
    return 'Quy tắc bình luận trên báo cáo công khai: tần suất, thời gian sửa hoặc thời hạn cấm khi vi phạm.';
  }
  if (k.includes('confidence') || k.includes('ai_flag')) {
    return 'Điều chỉnh mức nhạy của AI khi tự động gắn cờ báo cáo nghi ngờ — ảnh hưởng số lượng cảnh báo gửi cho cán bộ.';
  }
  if (
    k.includes('captcha') ||
    k.includes('lockout') ||
    k.includes('failed_login') ||
    k.includes('otp')
  ) {
    return 'Ảnh hưởng bảo mật đăng nhập: số lần thử sai, hiện CAPTCHA, khóa tạm tài khoản và giới hạn nhập mã OTP.';
  }
  if (k.includes('soft_delete') || (k.includes('retention') && k.includes('account'))) {
    return 'Thời gian giữ dữ liệu tài khoản sau khi người dùng xóa — trước khi hệ thống xóa vĩnh viễn không thể khôi phục.';
  }
  if (k.includes('flag') && k.includes('notify')) {
    return 'Khi đủ số lần gắn cờ hoặc báo cáo nghi ngờ, hệ thống gửi thông báo cho cán bộ hoặc quản trị viên xem xét.';
  }
  if (k.includes('duplicate')) {
    return 'Điều chỉnh cách phát hiện báo cáo trùng lặp: bán kính quét, số gợi ý hiển thị và điểm thưởng khi gộp vào báo cáo chính.';
  }
  if (k.includes('draft')) {
    return 'Quản lý bản nháp của công dân: số bản tối đa cùng lúc và thời gian lưu trước khi tự xóa.';
  }
  if (k.includes('decline_window')) {
    return 'Khoảng thời gian đội dọn được phép từ chối nhiệm vụ sau khi được gán — tránh giữ việc quá lâu không phản hồi.';
  }
  if (k.includes('progress_escalate')) {
    return 'Sau N giờ không có tiến độ mới, nhiệm vụ leo thang lên cán bộ (Escalated) theo quy trình BR-CLN.';
  }
  if (k.includes('progress_stale')) {
    return 'Ngưỡng cảnh báo sớm khi tiến độ dọn dẹp không được cập nhật — hiển thị trên dashboard trước khi leo thang.';
  }
  if (k.includes('progress_update_interval')) {
    return 'Tần suất đội dọn nên báo cáo tiến độ khi đang xử lý — dùng cho nhắc nhở và theo dõi minh bạch.';
  }
  if (k.includes('sla') || k.includes('overdue') || k.includes('unassigned')) {
    if (k.startsWith('inspection_sla_')) {
      return 'Hạn xử lý vụ thanh tra theo mức độ nghiêm trọng — số ngày hiển thị trên dashboard và thông báo quá hạn.';
    }
    return 'Thiết lập hạn xử lý và ngưỡng cảnh báo quá hạn — số giờ/ngày cũng được chèn vào thông báo và dashboard cán bộ.';
  }
  if (k.includes('map_default_grid_level') || k.includes('grid_level')) {
    return 'Điều chỉnh độ chia lưới khi gom nhiều báo cáo thành một ô trên bản đồ thu nhỏ — số lớn hơn nghĩa là chi tiết hơn.';
  }
  if (k.includes('map_max_aggregate_rows') || k.includes('aggregate_rows')) {
    return 'Trần số ô cụm server trả về mỗi lần — tránh một request aggregate trả quá nhiều dữ liệu.';
  }
  if (k.includes('bounding_lat_span')) {
    return 'Giới hạn chiều cao (theo vĩ độ) của khung hình bản đồ mỗi lần gọi API — zoom càng xa thì vùng quét càng rộng.';
  }
  if (k.includes('bounding_lng_span')) {
    return 'Giới hạn chiều ngang (theo kinh độ) của khung hình bản đồ mỗi lần gọi API.';
  }
  if (k.includes('detail_limit')) {
    return 'Số ghim báo cáo tối đa hiển thị khi zoom gần (chế độ detail) — liên quan giới hạn 100 điểm theo BR-MAP.';
  }
  if (k.includes('aggregate_limit')) {
    return 'Số ô gom hiển thị khi zoom xa (chế độ aggregate) — cân bằng giữa tổng quan và hiệu năng.';
  }
  if (k.includes('summary') && k.includes('days')) {
    return 'Khoảng thời gian lùi lại để tính tổng báo cáo và biểu đồ theo ngày trên bản đồ công khai.';
  }
  if (k.includes('refresh') && k.includes('interval')) {
    return 'Thời gian tối thiểu giữa hai lần client tải lại dữ liệu bản đồ — tránh spam request khi kéo liên tục.';
  }
  if (k.includes('map') || k.includes('nearby_report_radius_km')) {
    return 'Cấu hình hiển thị và truy vấn dữ liệu trên bản đồ công khai: giới hạn điểm, gom cụm và vùng quét.';
  }
  if (k.includes('nearby') && !k.includes('nearby_report')) {
    return 'Cấu hình báo cáo lân cận trên bản đồ hoặc thông báo quanh vị trí người dùng.';
  }
  if (k === 'submit_lock_seconds') {
    return 'Khoảng cách tối thiểu giữa hai lần gửi báo cáo liên tiếp — chặn spam tức thì sau mỗi lần submit.';
  }
  if (k === 'submit_max_per_day') {
    return 'Trần số báo cáo một tài khoản được gửi trong ngày — bổ sung cho giới hạn theo giờ.';
  }
  if (k.includes('audit_log_retention')) {
    return 'Thời gian lưu log hành động quản trị và cán bộ trước khi xóa vĩnh viễn — phục vụ audit và tuân thủ.';
  }
  if (k.includes('media_retention')) {
    return 'Thời gian lưu trữ ảnh/video minh chứng ô nhiễm trên server — ảnh hưởng khả năng xem lại báo cáo cũ.';
  }
  if (k.includes('status_history_retention')) {
    return 'Thời gian giữ lịch sử chuyển trạng thái báo cáo để tra cứu minh bạch xử lý.';
  }
  if (k.includes('inspection_evidence')) {
    return 'Giới hạn số file minh chứng cán bộ thanh tra upload mỗi request — tránh gửi quá nhiều ảnh một lúc.';
  }
  if (k.startsWith('inspection_sla_resolve_days_')) {
    const severity = k.split('_').pop();
    const severityVi: Record<string, string> = {
      critical: 'rất nghiêm trọng',
      high: 'nghiêm trọng',
      medium: 'trung bình',
      low: 'nhẹ',
    };
    const label = severityVi[severity ?? ''] ?? 'tương ứng';
    return `Số ngày cán bộ phải xử lý xong vụ thanh tra mức ${label} trước khi bị coi là quá hạn SLA.`;
  }
  if (k.includes('submit') || k.includes('spam') || k.includes('rate')) {
    return 'Giới hạn tốc độ gửi báo cáo của công dân và tiêu chí phát hiện tài khoản nghi gửi tin rác trên bảng Nghi spam.';
  }
  if (k.includes('contract')) {
    return 'Số ngày trước hạn hết hợp đồng công ty môi trường để hệ thống gửi cảnh báo cho quản trị và cán bộ.';
  }
  if (k.startsWith('priority_')) {
    if (k.includes('weight')) {
      return 'Trọng số xếp hàng đợi cán bộ — số càng lớn, yếu tố này càng ảnh hưởng mạnh đến thứ tự xử lý báo cáo.';
    }
    if (k.includes('boost')) {
      return 'Điểm cộng thêm khi báo cáo trễ hạn xác minh hoặc xử lý — giúp các vụ quá hạn nổi bật đầu danh sách.';
    }
    return 'Công thức xếp thứ tự ưu tiên báo cáo trong hàng đợi cán bộ môi trường.';
  }
  if (k.includes('auto_close') || k.includes('resolved')) {
    return 'Vòng đời sau khi xử lý xong: thời gian chờ phản hồi công dân trước khi hệ thống tự đóng báo cáo.';
  }
  if (k.includes('max_notifications')) {
    return 'Giới hạn số lần gửi cùng một loại thông báo cho mỗi người dùng trong một ngày — chống làm phiền công dân.';
  }
  if (k.includes('nearby_report_max_recipients')) {
    return 'Giới hạn số công dân nhận push khi có báo cáo mới gần vị trí họ — tránh gửi hàng loạt cho cả thành phố.';
  }
  if (k.includes('nearby_report_radius_meters')) {
    return 'Khoảng cách tối đa tính bằng mét để xét gửi thông báo "Báo cáo gần bạn" — không ảnh hưởng phạm vi hiển thị trên bản đồ.';
  }
  if (k.includes('notification') || k.includes('template') || k.includes('placeholder')) {
    return 'Giá trị số được chèn vào mẫu thông báo (vd. số giờ SLA) khi gửi push/email cho người dùng.';
  }
  if (k.includes('vietnam') && (k.includes('latitude') || k.includes('longitude'))) {
    return 'Ranh giới GPS hợp lệ trong lãnh thổ Việt Nam — báo cáo có tọa độ ngoài vùng sẽ bị từ chối khi gửi.';
  }
  if (k.endsWith('_threshold')) {
    return 'Vượt ngưỡng này sẽ kích hoạt quy tắc tương ứng (thông báo, cảnh báo hoặc chặn hành vi).';
  }
  if (k.endsWith('_hours')) {
    return 'Tính theo giờ — ảnh hưởng hạn xử lý, cảnh báo quá hạn và nội dung thông báo gửi cho cán bộ/công dân.';
  }
  if (k.endsWith('_days')) {
    return 'Tính theo ngày — ảnh hưởng thời hạn lưu trữ, tự đóng báo cáo hoặc cảnh báo hợp đồng sắp hết hạn.';
  }
  if (k.endsWith('_minutes')) {
    return 'Tính theo phút — thường dùng cho khóa tài khoản tạm hoặc thời hạn hiệu lực phiên đăng nhập.';
  }
  if (k.endsWith('_limit') || k.startsWith('max_') || k.startsWith('min_')) {
    return 'Giới hạn số lượng hoặc ngưỡng cho phép — tăng quá cao có thể làm chậm hệ thống hoặc giảm hiệu quả kiểm soát.';
  }

  const label = inferSystemSettingLabel(key);
  return `Điều chỉnh quy tắc "${label}", áp dụng ngay sau khi lưu và ảnh hưởng hành vi hệ thống tương ứng.`;
}
