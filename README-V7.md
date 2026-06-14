
# Math Exam V7 - nhiều đề + Google Sheets + Dashboard

## 1. Sinh nhiều đề
Đặt các file `.tex` vào thư mục `tex/`, ví dụ:

```text
tex/DE01.tex
tex/DE02.tex
tex/THI_THU_01.tex
```

Chạy:

```cmd
python parser\build_all.py
```

Chương trình tự sinh:

```text
exams/index.json
exams/<MA_DE>/questions.json
images/<MA_DE>/*.png
```

## 2. Chạy thử trên máy

```cmd
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

## 3. Kết nối Google Sheets

### Bước A: Tạo Google Sheet
Tạo một Google Sheet mới, đặt tên ví dụ: `KET_QUA_THI_TOAN`.

### Bước B: Mở Apps Script
Trong Google Sheet chọn:

```text
Tiện ích mở rộng → Apps Script
```

Xóa code cũ, dán toàn bộ nội dung file:

```text
apps_script/Code.gs
```

### Bước C: Triển khai Web App
Chọn:

```text
Triển khai → Lần triển khai mới → Ứng dụng web
```

Chọn:

```text
Thực thi dưới dạng: Tôi
Ai có quyền truy cập: Bất kỳ ai
```

Sao chép URL Web App.

### Bước D: Dán URL vào website
Mở file:

```text
js/config.js
```

Sửa dòng:

```js
window.EXAM_API_URL = '';
```

thành:

```js
window.EXAM_API_URL = 'URL_WEB_APP_CUA_THAY';
```

Lưu file và upload lại GitHub.

## 4. Xem kết quả
Mở:

```text
results.html
```

Bấm **Lấy từ Google Sheets** để tải toàn bộ kết quả.

Dashboard có:
- lọc theo đề
- lọc theo lớp
- tìm học sinh
- điểm trung bình/cao nhất/thấp nhất
- xuất CSV
- thống kê từng câu

## 5. Đưa lên GitHub Pages
Sau khi sinh đề xong, upload các thư mục/file sau lên GitHub:

```text
index.html
exam.html
result.html
results.html
admin.html
css/
js/
exams/
images/
apps_script/
```

Không bắt buộc upload `tex/` và `parser/` nếu chỉ cho học sinh làm bài. Nhưng nên giữ để quản lý lâu dài.
