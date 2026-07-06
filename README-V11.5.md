# V11.5

Bản vá tập trung vào lỗi hình TikZ dài không render được.

Điểm mới:

- Tách môi trường `tikzpicture`, `tabular`, `array` bằng bộ đếm begin/end thay vì regex.
- Tự gom tùy chọn `\begin{tikzpicture}[...]` thành một dòng để tránh lỗi `Paragraph ended before \tikz@picture was complete`.
- Khi hình lỗi, lưu thêm `qN_debug.tex` trong thư mục ảnh để dễ gửi kiểm tra.
- Giữ các sửa lỗi của V11.4 về hiển thị LaTeX văn bản.

Cách dùng như cũ:

```cmd
python teacher_manager.py
python -m http.server 8000
```
