# Math Exam V9 - Hệ thống thi trực tuyến môn Toán

Bản V9 theo yêu cầu:

## 1. Học sinh
- Vào link GitHub Pages để làm bài.
- Sau khi nộp bài, học sinh chỉ thấy **tổng điểm**.
- Học sinh không xem được lời giải, đáp án chi tiết, thống kê lớp.

## 2. Giáo viên
Có trang riêng `teacher.html`:
- Mật khẩu mặc định: `123456`.
- Vào dashboard kết quả.
- Cấu hình Google Sheets.
- Hướng dẫn chạy công cụ tạo đề.

> Lưu ý: GitHub Pages là web tĩnh nên không thể tự xử lý file `.tex` trực tiếp trên Internet. Việc đọc file LaTeX, render TikZ/tabular/array cần chạy bằng Python trên máy giáo viên.

## 3. Công cụ tạo đề V9 trên máy giáo viên
Chạy:

```cmd
cd D:\A-tao-web\math-exam-v9
python teacher_manager.py
```

Sau đó mở:

```text
http://localhost:8123
```

Công cụ có 2 cách nhập đề:
- Tải file `.tex` lên.
- Dán trực tiếp code LaTeX.

Hỗ trợ đề dùng `ex_test`, `\choice`, `\choiceTF`, `\shortans`, `tabular`, `array`, `tikz`.

## 4. Cấu hình thời gian
Trong công cụ V9 có:
- Số phút làm bài.
- Chỉ được nộp bài sau bao nhiêu phút.
- Số lần được làm bài trên cùng thiết bị.

## 5. Cấu hình điểm
Có thể cấu hình:
- Trắc nghiệm: tổng điểm, số câu.
- Đúng/Sai: tổng điểm, số câu.
- Trả lời ngắn: tổng điểm, số câu.

Đúng/Sai có 2 cách chấm:
- Lũy tiến: đúng 1 ý = 10%, 2 ý = 25%, 3 ý = 50%, 4 ý = 100% điểm câu đó.
- Chia đều: đúng bao nhiêu ý lấy bấy nhiêu phần. Ví dụ đúng 3 ý = 75% điểm câu đó.

## 6. Sau khi tạo đề xong
Upload lên GitHub các thư mục/file:

```text
exams/
images/
tex/
index.html
exam.html
result.html
results.html
teacher.html
css/
js/
apps_script/
```

Sau đó GitHub Pages tự cập nhật.

## 7. Google Sheets
Dùng file:

```text
apps_script/Code.gs
```

Dán vào Apps Script của Google Sheet, triển khai Web App với quyền:

```text
Ai có quyền truy cập: Bất kỳ ai
```

Copy URL Web App `/exec`, dán vào:

```text
js/config.js
```

Dòng:

```javascript
window.EXAM_API_URL = 'DAN_URL_WEB_APP_VAO_DAY';
```

## 8. Xem danh sách lớp
Giáo viên vào:

```text
results.html
```

Có thể:
- Lấy kết quả từ Google Sheets.
- Lọc theo lớp.
- Lọc theo đề.
- Tìm học sinh.
- Xuất CSV.
- Xem chi tiết từng bài làm.
