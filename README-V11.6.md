# V11.6

Bản vá tập trung vào lỗi `\heva`, `\hoac` và MathJax:

- Tự đổi `\heva{&x=...\\&y=...}` sang `\begin{cases}...\end{cases}`.
- Tự đổi `\hoac{...}` sang `array` một cột.
- Xóa dấu `&` đầu dòng để tránh lỗi `Misplaced &?`.
- Thêm lớp vá ở trình duyệt để các JSON cũ vẫn hiển thị tốt hơn.
- Giữ các sửa lỗi TikZ dài của V11.5.

Nếu hình không ra, xem `images/<mã đề>/qXX_error.log` và `qXX_debug.tex`.
