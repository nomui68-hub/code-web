# Math Exam V16

Bản vá ổn định:

- Ẩn hoàn toàn nút Trang giáo viên trên trang học sinh `index.html`.
- Mỗi lần giáo viên tạo/giao lại đề, hệ thống sinh `attemptToken` mới để học sinh không bị kẹt do lượt làm cũ trên điện thoại.
- Bảng điểm giáo viên tự ưu tiên lấy từ Google Sheets nếu `js/config.js` đã cấu hình URL Web App.
- Nút xóa toàn bộ trong dashboard chỉ xóa dữ liệu cục bộ của trình duyệt giáo viên, không xóa Google Sheets và không ảnh hưởng lượt làm trên điện thoại học sinh.

Lưu ý khi học sinh làm bằng điện thoại: nếu thầy muốn xem kết quả trên máy tính giáo viên, cần cấu hình Google Sheets trong `js/config.js` và Apps Script phải đang triển khai Web App quyền “Bất kỳ ai”.
