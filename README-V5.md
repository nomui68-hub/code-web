# math-exam-v5

Bản V5 đã sửa quy tắc chấm điểm theo cấu trúc thầy yêu cầu:

- 12 câu trắc nghiệm: mỗi câu đúng 0,25 điểm, tổng 3 điểm.
- 4 câu Đúng/Sai: đúng 1 ý được 0,10 điểm; đúng 2 ý được 0,25 điểm; đúng 3 ý được 0,50 điểm; đúng 4 ý được 1,00 điểm, tổng 4 điểm.
- 6 câu trả lời ngắn: mỗi câu đúng 0,50 điểm, tổng 3 điểm.
- Tổng điểm tối đa: 10 điểm.

## Chạy tạo đề mới từ file LaTeX

Thay file `tex/de.tex`, sau đó chạy:

```cmd
python parser\parser_v4.py tex\de.tex data\questions.json DE_MAU
python parser\render_visuals_v2.py data\questions.json images
python -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

## Lưu kết quả lên Google Sheets

1. Tạo Google Sheet.
2. Vào Extensions → Apps Script.
3. Dán code trong `apps_script/Code.gs`.
4. Deploy dạng Web App, quyền truy cập Anyone.
5. Copy URL Web App.
6. Dán URL đó vào biến `API_URL` trong `js/api.js`.
7. Upload lại GitHub Pages.

Nếu chưa cấu hình Google Sheets, kết quả vẫn lưu cục bộ trong trình duyệt và xem ở `results.html`.
