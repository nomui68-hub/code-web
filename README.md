# Math Exam V16

Bản này kế thừa V15 và vá các lỗi giáo viên/học sinh.

- Trang học sinh không còn liên kết vào trang giáo viên.
- Tạo lại đề sẽ tự reset lượt làm bằng token mới.
- Dashboard giáo viên tự lấy Google Sheets nếu đã cấu hình.

# Math Exam V15

Bản V15 bổ sung nút chụp ảnh tự luận trên điện thoại và thời gian mở/đóng đề thi theo ngày giờ.

# Math Exam V11.3 Stable

Bản V11.3 vá lỗi parser V11.2 sinh `questions: []`, đồng thời xử lý tốt hơn các lệnh LaTeX văn bản như `\textbf`, `\textit`, `{\it ...}`, `center`, `itemize`, `itemchoice`.

# Hệ thống thi trực tuyến môn Toán - V10

## 1. Điểm mới của V10

- Tách rõ trang học sinh và trang giáo viên.
- Học sinh làm xong chỉ thấy **tổng điểm**, không thấy đáp án chi tiết.
- Trang giáo viên có mật khẩu mặc định `123456`.
- Học sinh chọn đề từ danh sách `exams/index.json`, không cần gõ mã đề.
- Mỗi đề có cấu hình riêng: thời gian, nộp sau bao nhiêu phút, số lần làm, điểm TN/ĐS/TLN.
- Hỗ trợ chấm Đúng/Sai theo 2 kiểu:
  - `progressive`: đúng 1 ý 10%, 2 ý 25%, 3 ý 50%, 4 ý 100%.
  - `equal`: đúng mấy ý lấy mấy phần.
- Render TikZ/tabular/array vào `images/<MA_DE>/qN.png`.
- Tự xử lý một số mã rác `\href...` và giảm vòng lặp TikZ quá nặng để hạn chế lỗi mất hình.

## 2. Chạy công cụ giáo viên tạo đề

```cmd
cd D:\A-tao-web\math-exam-v10
python teacher_manager.py
```

Mở:

```text
http://localhost:8123
```

Tại đây thầy có thể:

- Chọn file `.tex` dùng `ex_test`.
- Hoặc dán code LaTeX.
- Nhập mã đề, tên đề.
- Cấu hình thời gian và điểm.
- Bấm **Lưu bài và giao bài**.

## 3. Chạy web học sinh trên máy giáo viên để thử

Mở CMD thứ hai:

```cmd
cd D:\A-tao-web\math-exam-v10
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

Học sinh nhập mã, họ tên, lớp, chọn đề và làm bài.

## 4. Trang giáo viên

Mở:

```text
http://localhost:8000/teacher.html
```

Mật khẩu mặc định:

```text
123456
```

Muốn đổi mật khẩu, mở file:

```text
js/teacher.js
```

sửa dòng:

```js
const TEACHER_PASSWORD = '123456';
```

## 5. Đưa lên GitHub Pages

Sau khi tạo đề xong, upload các thư mục/file sau lên GitHub:

```text
exams/
images/
tex/
js/
css/
index.html
exam.html
result.html
results.html
teacher.html
admin.html
apps_script/
```

Link học sinh sẽ là dạng:

```text
https://nomui68-hub.github.io/code-web/
```

## 6. Google Sheets

1. Tạo Google Sheet `KetQuaThiOnline`, tab `KETQUA`.
2. Dán code trong `apps_script/Code.gs` vào Apps Script.
3. Triển khai dạng Web App, quyền truy cập `Bất kỳ ai`.
4. Copy URL `/exec` vào file `js/config.js`:

```js
window.EXAM_API_URL = 'https://script.google.com/macros/s/.../exec';
```

5. Upload lại `js/config.js` lên GitHub.

## 7. Lưu ý về hình TikZ

Nếu một hình quá nặng vẫn không hiện, mở file `.tex` và:

- xóa dòng dạng `\href{...}{	iny \phantom{...}}`;
- giảm `oreach \i in {1,...,500}` xuống khoảng `80` hoặc `100`.

V10 đã tự xử lý một phần, nhưng hình quá phức tạp vẫn nên tối ưu lại.


# V11 - Ghi chú nâng cấp

V11 sửa các điểm sau:

- Parser LaTeX nhận tốt hơn các lệnh chữ: `\textbf{...}`, `\textit{...}`, `\emph{...}`, `{\it{...}}`, `{\it ...}`.
- Sửa lỗi mất dấu ngoặc hoặc dính chữ khi dùng `{\it{(đơn vị trên trục tính bằng mét)}}`.
- Hỗ trợ render thêm môi trường `array` ngoài `tabular`, `tikzpicture`.
- Dashboard kết quả có 3 lựa chọn xóa: xóa dòng đã chọn, xóa theo bộ lọc, hoặc xóa toàn bộ cục bộ.
- Công cụ giáo viên có nút quét toàn bộ file `.tex` trong thư mục `tex/` để tạo nhiều đề cùng lúc.
- Render TikZ tự bỏ các mã `\href{...}{...}` và giảm vòng lặp ngẫu nhiên quá nặng để hạn chế lỗi hình.

## Chạy V11

```cmd
cd D:\A-tao-web\math-exam-v11
python teacher_manager.py
```

Trang học sinh:

```cmd
python -m http.server 8000
```

Mở `http://localhost:8000`.


## V11.5

Sửa lỗi render TikZ dài, đặc biệt lỗi `Paragraph ended before \tikz@picture was complete`. Nếu hình vẫn lỗi, kiểm tra file `images/<mã đề>/qN_debug.tex` và `qN_error.log`.


## V12 - An toàn hình ảnh
Xem README-V12.md.


## V13

Bổ sung phần tự luận tự chấm bằng `\essayans{...}` hoặc `\tuluanans{...}`; hỗ trợ điểm từng câu tự luận.
