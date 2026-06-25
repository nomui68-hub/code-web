# Math Exam V13 - Bổ sung phần tự luận tự chấm

V13 kế thừa V12 an toàn hình ảnh và bổ sung phần 4: câu tự luận.

## Cách dùng câu tự luận

Trong file LaTeX, một câu `ex` không có `\choice`, `\choiceTF`, `\shortans` sẽ được hiểu là câu tự luận.

Để tự động chấm, thêm đáp án bằng một trong các lệnh:

```latex
\essayans{đáp án}
````
hoặc
```latex
\tuluanans{đáp án}
````

Nếu có nhiều đáp án đúng, ngăn cách bằng dấu `|`:

```latex
\essayans{2|2,0|2.0}
````

Hệ thống tự chấm bằng cách so khớp đáp án sau khi bỏ khoảng trắng và chuẩn hóa dấu phẩy/dấu chấm. Với bài tự luận dài không có đáp án khóa, hệ thống sẽ lưu bài làm nhưng cho 0 điểm để giáo viên xem sau.

## Cấu hình điểm

Ở trang tạo đề có thêm:

- Tự luận: tổng điểm
- Tự luận: số câu
- Điểm từng câu tự luận, ví dụ: `1, 1, 0.5`

Nếu không nhập điểm từng câu, hệ thống chia đều tổng điểm cho số câu tự luận.
