# Math Exam V4 - Quản lý kết quả học sinh

## Chạy thử trên máy

```cmd
cd D:\A-tao-web\math-exam-v4
python parser\parser_v4.py tex\de.tex data\questions.json DE_MAU
python parser\render_visuals_v2.py data\questions.json images
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

## Xem danh sách kết quả

Mở:

```text
http://localhost:8000/results.html
```

Nếu chưa cấu hình Google Sheets, danh sách kết quả chỉ lưu trên trình duyệt hiện tại.

## Lưu Google Sheets

1. Tạo Google Sheet mới.
2. Vào Extensions → Apps Script.
3. Dán nội dung `apps_script/Code.gs`.
4. Deploy → New deployment → Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Copy URL `/exec`.
8. Mở `js/api.js`, dán URL vào:

```js
const API_URL = 'https://script.google.com/macros/s/.../exec';
```

Từ lúc đó, học sinh nộp bài sẽ lưu lên Google Sheets.

## Đổi sang đề LaTeX khác

Chép file `.tex` mới vào:

```text
tex/de.tex
```

Sau đó chạy lại:

```cmd
python parser\parser_v4.py tex\de.tex data\questions.json DE_MAU
python parser\render_visuals_v2.py data\questions.json images
python -m http.server 8000
```

Nếu đổi mã đề, thay `DE_MAU` bằng mã khác, ví dụ `DE_101`.
