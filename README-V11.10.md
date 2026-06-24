# V11.10

Bản vá lỗi dấu `<` và `>` trong công thức toán khi hiển thị bằng HTML.

## Sửa chính

- Tự đổi dấu `<` trong các đoạn `$...$`, `\[...\]`, `\(...\)` thành `&lt;` trước khi đưa vào `innerHTML`.
- Sửa lỗi câu kiểu `$0\le a<b\le 12$` bị cắt mất phần sau.
- Giữ các sửa từ V11.9: `\heva`, `\hoac`, `\break`, TikZ dài, bảng `tabular/multirow/makecell`.

## Cách dùng

1. Giải nén thư mục.
2. Chạy:

```cmd
python teacher_manager.py
```

3. Tạo lại đề từ file `.tex` để sinh `questions.json` mới.
4. Nếu đưa lên GitHub, upload lại ít nhất:

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
```
