# V15 - Chụp ảnh tự luận và mở đề theo thời gian

## Nâng cấp chính

1. Tự luận trên điện thoại có nút **Chụp ảnh**.
   - Học sinh bấm nút này để mở camera điện thoại.
   - Sau khi chụp, ảnh được gửi kèm bài làm.
   - Vẫn có nút **Tải ảnh lên** để chọn ảnh có sẵn.

2. Giáo viên đặt thời gian được phép mở bài thi.
   - Mở bài thi từ: giờ, phút, ngày, tháng, năm.
   - Đóng bài thi vào: giờ, phút, ngày, tháng, năm.
   - Ngoài khoảng này học sinh không vào làm được.

3. Kế thừa V14:
   - Ẩn đề mẫu với học sinh.
   - Chỉ hiện các đề giáo viên tạo.
   - Trộn câu trắc nghiệm và phương án theo từng học sinh.
   - Tự luận chấm tay cộng vào tổng điểm khi xuất CSV.

## Chạy

```cmd
cd D:\A-tao-web\math-exam-v15
python teacher_manager.py
```

Web học sinh:

```cmd
python -m http.server 8000
```
