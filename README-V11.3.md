# V11.3 Stable

Bản vá ổn định parser sau V11.2.

## Sửa chính
- Không còn lỗi `questions: []` do regex.
- Sửa hiển thị `\textbf`, `\textit`, `\emph`, `{\it ...}`.
- Không hiện `\begin{center}`, `\end{center}`, `\begin{itemize}`, `\end{itemize}`, `itemchoice`.
- Giữ dấu ngoặc và khoảng trắng, tránh chữ bị dính.
- Nếu parser tạo ra 0 câu hỏi, chương trình báo lỗi và không lưu đề rỗng.

## Chạy
```cmd
python teacher_manager.py
```
