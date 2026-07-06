# V17 - Bản ổn định quản lý đề

## Điểm mới
- Học sinh chỉ thấy các đề active trong `exams/index.json`.
- Không hiện `DE_MAU` trên trang học sinh.
- Trang học sinh không có nút Trang giáo viên.
- Tạo một đề mới có tùy chọn xóa danh sách đề cũ.
- Quét toàn bộ thư mục `tex/` sẽ tạo lại danh sách đề sạch từ đầu.
- Trộn thứ tự câu trắc nghiệm và phương án theo từng học sinh được giữ lại từ V14.
- Tự luận chấm tay, nộp ảnh bài làm, chấm và xuất CSV/Excel giữ lại từ V15/V16.

## Cách chạy
```cmd
cd D:\A-tao-web\math-exam-v17
python teacher_manager.py
```

Web học sinh:
```cmd
python -m http.server 8000
```

Mở: `http://localhost:8000/index.html`

## Khi đưa lên GitHub
Upload: `index.html`, `exam.html`, `result.html`, `results.html`, `css/`, `js/`, `exams/`, `images/`, `apps_script/` nếu dùng Google Sheets.
