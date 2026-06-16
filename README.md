

# V9.1-Python313

Bản này sửa lỗi `ModuleNotFoundError: No module named cgi` khi chạy bằng Python 3.13.

Cách chạy công cụ giáo viên:

```cmd
cd D:\A-tao-web\math-exam-v9.1-python313
python teacher_manager.py
```

Sau đó mở:

```text
http://localhost:8123
```

Nếu dùng file `chay_quan_ly_de.bat` thì chỉ cần nhấp đúp file đó.

# Math Exam V8 - Lưu kết quả online Google Sheets

## 1. Chạy thử trên máy

```cmd
cd D:\A-tao-web\math-exam-v8
python parser\build_all.py
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

## 2. Tạo nhiều đề

Chép các file `.tex` vào thư mục:

```text
tex/
```

Ví dụ:

```text
tex/DE01.tex
tex/DE02.tex
tex/THI_THU_01.tex
```

Sau đó chạy:

```cmd
python parser\build_all.py
```

Hệ thống tự sinh:

```text
exams/
images/
```

## 3. Đưa lên GitHub Pages

Upload các thư mục và file lên GitHub:

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

## 4. Kết nối Google Sheets

### Bước 1
Tạo Google Sheet mới, ví dụ:

```text
KetQuaThiOnline
```

### Bước 2
Vào:

```text
Tiện ích mở rộng → Apps Script
```

Xóa code cũ, dán toàn bộ nội dung file:

```text
apps_script/Code.gs
```

### Bước 3
Bấm:

```text
Triển khai → Lần triển khai mới
```

Chọn loại:

```text
Ứng dụng web
```

Cấu hình:

```text
Thực thi với tư cách: Tôi
Ai có quyền truy cập: Bất kỳ ai
```

Bấm triển khai, rồi copy link dạng:

```text
https://script.google.com/macros/s/XXXXX/exec
```

### Bước 4
Mở file:

```text
js/config.js
```

Dán link vào dòng:

```js
window.EXAM_API_URL = 'https://script.google.com/macros/s/XXXXX/exec';
```

Lưu file rồi upload lại `js/config.js` lên GitHub.

## 5. Kiểm tra

Mở:

```text
admin.html
```

Dán Web App URL và bấm **Kiểm tra kết nối**.

Sau đó cho học sinh làm bài. Khi học sinh nộp bài, Google Sheet sẽ có dòng mới gồm:

```text
Mã HS | Họ tên | Lớp | Mã đề | Điểm | Điểm TN | Điểm ĐS | Điểm TLN | Bài làm chi tiết
```

## 6. Xem bảng điểm

Mở:

```text
results.html
```

Bấm:

```text
Lấy từ Google Sheets
```

để xem toàn bộ học sinh đã nộp bài từ các máy/điện thoại khác nhau.
