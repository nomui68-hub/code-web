# Math Exam V3

Bản V3 sửa hai lỗi chính:

- Loại bỏ lỗi MathJax `Unknown environment 'itemize'` bằng cách chuyển `itemize/enumerate` sang HTML đơn giản.
- Xóa mã rác trong hình dạng `\href{ABC123}{\tiny\phantom{ABC123}}` trước khi render PNG.

## Chạy lại parser và xuất hình

Đứng tại thư mục dự án:

```cmd
D:
cd D:\A-tao-web\math-exam-v3
python parser\parser_v4.py tex\de.tex data\questions.json DE_MAU
python parser\render_visuals_v2.py data\questions.json images
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

Nếu đang dùng bản cũ `math-exam-v2`, có thể chép hai file sau vào thư mục `parser` của bản V2:

```text
parser_v4.py
render_visuals_v2.py
```

rồi chạy lại hai lệnh trên.
