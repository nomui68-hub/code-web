# Math Exam V12 - An toàn hình ảnh

V12 giữ các chức năng của V11.10 và bổ sung cơ chế an toàn hình ảnh:

- Mỗi đề có thư mục ảnh riêng: `images/MÃ_ĐỀ/qN.png`.
- Khi TikZ/bảng render lỗi, đề vẫn tạo bình thường, không làm hỏng bài thi.
- Hệ thống lưu `qN_error.log`, `qN_debug.tex` và `render_report.json`.
- Trang giáo viên có mục **Sửa hình nhanh**: nhập mã đề + số câu + chọn ảnh PNG/JPG để gán cho câu bị lỗi.
- Có thể chụp/cắt hình từ PDF gốc rồi upload thay thế cho câu lỗi.

## Chạy

```cmd
cd D:\A-tao-web\math-exam-v12
python teacher_manager.py
```

Web học sinh:

```cmd
python -m http.server 8000
```

Mở `http://localhost:8000`.
