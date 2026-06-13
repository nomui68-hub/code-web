# Math Exam V6-V7

Bản V6 kết hợp V7: hỗ trợ nhiều đề thi trong cùng một website.

## 1. Cấu trúc đề

- Đề LaTeX đặt trong thư mục `tex/`.
- Mỗi file `.tex` sẽ sinh ra một đề riêng.

Ví dụ:

```text
tex/
  DE01.tex
  DE02.tex
  THI_THU_01.tex
```

Sau khi build, website có:

```text
exams/DE01/questions.json
exams/DE02/questions.json
images/DE01/q1.png
images/DE02/q1.png
```

Học sinh sẽ chọn đề ở trang đăng nhập.

## 2. Tạo tất cả đề tự động

Mở CMD tại thư mục dự án:

```cmd
cd D:\A-tao-web\math-exam-v6
```

Chạy:

```cmd
python parser\build_all.py
```

Lệnh này sẽ quét tất cả file `.tex` trong thư mục `tex/` và tự tạo:

```text
exams/index.json
exams/<MA_DE>/questions.json
images/<MA_DE>/q*.png
```

## 3. Tạo một đề riêng

Ví dụ tạo đề `DE01` từ file `tex\DE01.tex`:

```cmd
python parser\build_one.py tex\DE01.tex DE01 "Đề kiểm tra 01"
```

## 4. Chạy thử trên máy

```cmd
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

## 5. Đưa lên GitHub Pages

Sau khi build xong, upload hoặc commit các thư mục/file sau lên GitHub:

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

Nếu chỉ thêm đề mới thì thường chỉ cần upload:

```text
tex/
exams/
images/
```

## 6. Quy tắc chấm điểm

- Trắc nghiệm: 0,25 điểm/câu.
- Đúng/Sai:
  - đúng 1 ý: 0,10 điểm
  - đúng 2 ý: 0,25 điểm
  - đúng 3 ý: 0,50 điểm
  - đúng 4 ý: 1,00 điểm
- Trả lời ngắn: 0,50 điểm/câu.

Tổng điểm theo cấu trúc 12 TN + 4 Đ/S + 6 TLN là 10 điểm.

## 7. Lưu kết quả

- Khi chưa cấu hình Google Sheets, kết quả lưu tạm trong trình duyệt.
- Khi cấu hình `js/api.js` với Google Apps Script URL, kết quả sẽ gửi lên Google Sheets.

