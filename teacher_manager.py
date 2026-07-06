# teacher_manager.py
# Công cụ giáo viên V15: không dùng module cgi, chạy tốt với Python 3.13+
# Chạy: python teacher_manager.py rồi mở http://localhost:8123

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs
from email.parser import BytesParser
import datetime
from email.policy import default as email_default_policy
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import traceback
import time
import webbrowser

ROOT = Path(__file__).resolve().parent
PORT = 8123

def safe_id(s):
    s = (s or '').strip().upper()
    s = re.sub(r'[^A-Z0-9_-]+', '_', s)
    return s or 'DE_MOI'

def page(msg=''):
    return f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>V17 - Quản lý đề thi Toán</title><style>
body{{font-family:Arial, sans-serif;background:#f3f6fb;margin:0;color:#07142b}} .wrap{{max-width:1100px;margin:30px auto;padding:0 18px}}
.card{{background:white;border:1px solid #dbe5f3;border-radius:16px;padding:22px;margin:18px 0;box-shadow:0 8px 24px #0001}}
h1{{margin-top:0}} label{{font-weight:700;display:block;margin:12px 0 6px}} input,textarea,select{{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd7ea;border-radius:10px;font-size:16px}} textarea{{min-height:260px;font-family:Consolas,monospace}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}} .grid2{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}
.btn{{background:#1d5fb8;color:white;border:0;border-radius:10px;padding:13px 18px;font-weight:700;cursor:pointer}} .muted{{color:#5b6b83}} .ok{{background:#e9fbe9;border-left:5px solid #22a447;padding:12px}} .bad{{background:#fff0f0;border-left:5px solid #c93030;padding:12px}} pre{{white-space:pre-wrap;background:#0b1020;color:#d7e7ff;padding:14px;border-radius:10px;overflow:auto}}
.tabs{{display:flex;gap:10px;flex-wrap:wrap}} .tab{{padding:10px 14px;border-radius:999px;border:1px solid #cbd7ea;background:#f8fbff;cursor:pointer}} .tab.active{{background:#1d5fb8;color:white}}
.panel{{display:none}} .panel.active{{display:block}}
@media(max-width:800px){{.grid,.grid2{{grid-template-columns:1fr}}}}
</style></head><body><div class="wrap">
<div class="card"><h1>V17 - Quản lý đề thi Toán Toán</h1><p class="muted">Công cụ này chạy trên máy giáo viên. V17 tổ chức lại danh sách đề: học sinh chỉ thấy các đề active trong exams/index.json, không hiện đề mẫu và không hiện trang giáo viên.</p></div>
{msg}
<form class="card" method="post" action="/build" enctype="multipart/form-data">
<h2>1. Chọn file đề hoặc dán code LaTeX</h2>
<div class="tabs"><button type="button" class="tab active" onclick="showTab('upload',this)">Tải file .tex lên</button><button type="button" class="tab" onclick="showTab('paste',this)">Dán code LaTeX</button></div>
<div id="upload" class="panel active"><label>Chọn file TEX dùng gói ex_test</label><input type="file" name="texfile" accept=".tex,text/plain"></div>
<div id="paste" class="panel"><label>Dán code LaTeX</label><textarea name="latexcode" placeholder="Dán toàn bộ code đề thi LaTeX ở đây..."></textarea></div>
<div class="grid2"><div><label>Mã đề</label><input name="exam_id" placeholder="VD: DE01" required></div><div><label>Tên đề hiển thị</label><input name="title" placeholder="VD: Kiểm tra cuối kì 1"></div></div>
<h2>2. Thời gian làm bài</h2>
<div class="grid"><div><label>Số phút làm bài</label><input type="number" name="duration" value="90" min="1"></div><div><label>Chỉ được nộp bài sau (phút)</label><input type="number" name="submit_after" value="0" min="0"></div><div><label>Số lần được làm bài</label><input type="number" name="attempts" value="1" min="1"></div></div>
<h2>2b. Thời gian được phép mở bài thi</h2>
<p class="muted">Có thể để trống nếu muốn mở đề ngay. Khi đặt thời gian, học sinh chỉ vào làm được trong khoảng thời gian này.</p>
<div class="grid2"><div><label>Mở bài thi từ</label><input type="datetime-local" name="open_at"></div><div><label>Đóng bài thi vào</label><input type="datetime-local" name="close_at"></div></div>
<h2>3. Cấu hình điểm số</h2>
<div class="grid"><div><label>Trắc nghiệm: tổng điểm</label><input type="number" step="0.01" name="choice_total" value="3"></div><div><label>Trắc nghiệm: số câu</label><input type="number" name="choice_count" value="12"></div><div></div>
<div><label>Đúng/Sai: tổng điểm</label><input type="number" step="0.01" name="tf_total" value="4"></div><div><label>Đúng/Sai: số câu</label><input type="number" name="tf_count" value="4"></div><div><label>Cách chấm Đúng/Sai</label><select name="tf_mode"><option value="progressive">Lũy tiến: 10%, 25%, 50%, 100%</option><option value="equal">Chia đều: đúng mấy ý lấy mấy phần</option></select></div>
<div><label>Trả lời ngắn: tổng điểm</label><input type="number" step="0.01" name="short_total" value="3"></div><div><label>Trả lời ngắn: số câu</label><input type="number" name="short_count" value="6"></div><div></div>
<div><label>Tự luận: tổng điểm</label><input type="number" step="0.01" name="essay_total" value="0"></div><div><label>Tự luận: số câu</label><input type="number" name="essay_count" value="0"></div><div><label>Điểm từng câu tự luận</label><input name="essay_points" placeholder="VD: 1, 1, 0.5"></div></div>
<p class="muted"><b>Tự luận:</b> có 3 kiểu trong LaTeX. Với câu chấm tay/rubric, học sinh có thể gõ bài làm hoặc chụp ảnh bài làm trên giấy để nộp.<br>
1) Tự chấm kết quả: <code>\essayans{{2|2,0}}</code><br>
2) Giáo viên chấm tay: <code>\essaymanual[2]</code><br>
3) Chấm theo thang điểm: <code>\essayrubric{{{{0.5}}{{Lập đúng phương trình}}{{0.5}}{{Tính đúng kết quả}}}}</code></p>
<label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" name="clear_old" value="1" checked style="width:auto"> Xóa danh sách đề cũ, chỉ giao đề này sau khi tạo</label><p class="muted">Nếu muốn giao 2–3 đề cùng lúc, đặt các file .tex vào thư mục tex/ rồi dùng mục 5: Quét toàn bộ đề trong thư mục tex.</p><p><button class="btn" type="submit">Lưu bài và giao bài</button></p>
</form>
<form class="card" method="post" action="/upload_image" enctype="multipart/form-data">
<h2>4. Sửa hình nhanh cho câu bị lỗi</h2>
<p class="muted">Nếu một câu không tự xuất được hình, thầy chụp/cắt hình từ PDF rồi tải lên. Hệ thống tự lưu đúng đường dẫn <b>images/MÃ_ĐỀ/qSỐ_CÂU.png</b> và cập nhật <b>questions.json</b>.</p>
<div class="grid"><div><label>Mã đề</label><input name="img_exam_id" placeholder="VD: 2-KS-20" required></div><div><label>Số câu</label><input type="number" name="img_qid" placeholder="VD: 22" min="1" required></div><div><label>Chọn ảnh PNG/JPG</label><input type="file" name="imagefile" accept="image/png,image/jpeg,image/jpg,image/webp" required></div></div>
<p><button class="btn" type="submit">Gán ảnh cho câu</button></p>
</form>
<form class="card" method="post" action="/build_all">
<h2>5. Quét toàn bộ đề trong thư mục tex</h2>
<p class="muted">Dùng khi thầy có nhiều file .tex trong thư mục <b>tex/</b>. Hệ thống sẽ tạo mỗi file thành một đề riêng và cập nhật danh sách đề cho học sinh chọn.</p>
<p><button class="btn" type="submit">Tạo tất cả đề trong thư mục tex</button></p>
</form>
<div class="card"><h2>6. Đưa đề lên GitHub</h2><p>Sau khi tạo xong, upload các thư mục/file sau lên GitHub để học sinh làm online:</p><pre>exams/
images/
tex/
js/
index.html
exam.html
result.html
results.html
teacher.html</pre></div>
<script>function showTab(id,btn){{document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');btn.classList.add('active');}}</script>
</div></body></html>'''


def parse_post_form(handler):
    """Đọc form POST multipart/form-data hoặc x-www-form-urlencoded, không dùng cgi.
    Trả về (fields, files) trong đó files[name] = {'filename':..., 'content': bytes}.
    """
    ctype = handler.headers.get('Content-Type', '')
    length = int(handler.headers.get('Content-Length', '0') or 0)
    body = handler.rfile.read(length)
    fields = {}
    files = {}

    if 'multipart/form-data' in ctype.lower():
        raw = (f'Content-Type: {ctype}\r\nMIME-Version: 1.0\r\n\r\n').encode('utf-8') + body
        msg = BytesParser(policy=email_default_policy).parsebytes(raw)
        if msg.is_multipart():
            for part in msg.iter_parts():
                disp = part.get('Content-Disposition', '')
                if 'form-data' not in disp:
                    continue
                name = part.get_param('name', header='content-disposition')
                if not name:
                    continue
                filename = part.get_filename()
                payload = part.get_payload(decode=True) or b''
                if filename:
                    files[name] = {'filename': filename, 'content': payload}
                else:
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        fields[name] = payload.decode(charset, errors='replace')
                    except LookupError:
                        fields[name] = payload.decode('utf-8', errors='replace')
    else:
        # Form thường: application/x-www-form-urlencoded
        text = body.decode('utf-8', errors='replace')
        qs = parse_qs(text, keep_blank_values=True)
        fields = {k: (v[0] if v else '') for k, v in qs.items()}
    return fields, files

def read_field(fields, name, default=''):
    return fields.get(name, default)

def build_all_exams():
    cmd = [sys.executable, str(ROOT/'parser'/'build_all.py')]
    proc = subprocess.run(cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    if proc.returncode not in (0,):
        raise RuntimeError(proc.stdout)
    return proc.stdout

def build_exam(fields, files):
    exam_id = safe_id(read_field(fields,'exam_id','DE_MOI'))
    title = read_field(fields,'title',exam_id).strip() or exam_id
    tex_dir = ROOT/'tex'; tex_dir.mkdir(exist_ok=True)
    tex_path = tex_dir/f'{exam_id}.tex'
    latexcode = read_field(fields,'latexcode','')
    fileitem = files.get('texfile')
    if fileitem and fileitem.get('filename') and fileitem.get('content'):
        tex_path.write_bytes(fileitem['content'])
    elif latexcode.strip():
        tex_path.write_text(latexcode, encoding='utf-8')
    else:
        raise ValueError('Chưa chọn file TEX hoặc chưa dán code LaTeX.')

    settings = {
        'durationMinutes': float(read_field(fields,'duration','90') or 90),
        'submitAfterMinutes': float(read_field(fields,'submit_after','0') or 0),
        'maxAttempts': int(float(read_field(fields,'attempts','1') or 1)),
        'openAt': read_field(fields,'open_at','').strip(),
        'closeAt': read_field(fields,'close_at','').strip(),
        'attemptToken': str(int(time.time())),
        'buildAt': datetime.datetime.now().isoformat(timespec='seconds'),
        'scoring': {
            'choiceTotal': float(read_field(fields,'choice_total','3') or 0),
            'choiceCount': int(float(read_field(fields,'choice_count','12') or 1)),
            'truefalseTotal': float(read_field(fields,'tf_total','4') or 0),
            'truefalseCount': int(float(read_field(fields,'tf_count','4') or 1)),
            'shortTotal': float(read_field(fields,'short_total','3') or 0),
            'shortCount': int(float(read_field(fields,'short_count','6') or 1)),
            'essayTotal': float(read_field(fields,'essay_total','0') or 0),
            'essayCount': int(float(read_field(fields,'essay_count','0') or 0)),
            'essayPoints': [float(x.strip().replace(',', '.')) for x in re.split(r'[;\n]+|,(?=\s*\d)', read_field(fields,'essay_points','')) if x.strip()],
            'truefalseMode': read_field(fields,'tf_mode','progressive')
        }
    }
    cfg_dir = ROOT/'data'; cfg_dir.mkdir(exist_ok=True)
    cfg_path = cfg_dir/f'{exam_id}_settings.json'
    cfg_path.write_text(json.dumps(settings,ensure_ascii=False,indent=2),encoding='utf-8')
    cmd = [sys.executable, str(ROOT/'parser'/'build_one.py'), str(tex_path), exam_id, title, '--config', str(cfg_path)]
    if read_field(fields,'clear_old','') == '1':
        cmd.append('--clear-index')
    proc = subprocess.run(cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    if proc.returncode not in (0,):
        raise RuntimeError(proc.stdout)
    return exam_id, title, proc.stdout


def update_question_image(exam_id, qid, image_bytes, filename='image.png'):
    exam_id = safe_id(exam_id)
    qid = int(qid)
    img_dir = ROOT/'images'/exam_id
    img_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(filename or '').suffix.lower()
    if suffix not in ('.png', '.jpg', '.jpeg', '.webp'):
        suffix = '.png'
    # Dùng png làm tên chuẩn để đường dẫn ổn định.
    out_path = img_dir/f'q{qid}.png'
    out_path.write_bytes(image_bytes)
    qjson = ROOT/'exams'/exam_id/'questions.json'
    if qjson.exists():
        data = json.loads(qjson.read_text(encoding='utf-8'))
        for q in data.get('questions', []):
            if int(q.get('id', -1)) == qid:
                q['image'] = f'images/{exam_id}/q{qid}.png'
                q['manualImage'] = True
                q['renderStatus'] = 'manual'
                q['needsImage'] = True
        qjson.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    return out_path

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(page().encode('utf-8'))

    def do_POST(self):
        try:
            if self.path.startswith('/build_all'):
                log = build_all_exams()
                msg = f'<div class="card ok"><h2>Đã tạo tất cả đề trong thư mục tex</h2><p><a class="btn" href="http://localhost:8000/index.html">Mở trang học sinh</a> <a class="btn" href="http://localhost:8000/exams/index.json">Xem danh sách đề</a></p><pre>{html.escape(log)}</pre></div>'
            elif self.path.startswith('/upload_image'):
                fields, files = parse_post_form(self)
                f = files.get('imagefile')
                if not f or not f.get('content'):
                    raise ValueError('Chưa chọn ảnh.')
                out_path = update_question_image(read_field(fields,'img_exam_id'), read_field(fields,'img_qid'), f['content'], f.get('filename','image.png'))
                msg = f'<div class="card ok"><h2>Đã gán ảnh thành công</h2><p>Đã lưu: <b>{html.escape(str(out_path.relative_to(ROOT)))}</b></p><p><a class="btn" href="http://localhost:8000/index.html">Mở trang học sinh</a></p></div>'
            else:
                fields, files = parse_post_form(self)
                exam_id,title,log = build_exam(fields, files)
                report_path = ROOT/'images'/exam_id/'render_report.json'
                report_note = ''
                if report_path.exists():
                    report_note = '<p><b>Báo cáo hình:</b> '+html.escape(report_path.read_text(encoding='utf-8')[:1200])+'</p>'
                msg = f'<div class="card ok"><h2>Đã lưu bài và giao bài: {html.escape(title)}</h2><p>Mã đề: <b>{html.escape(exam_id)}</b></p>{report_note}<p><a class="btn" href="http://localhost:8000/index.html">Mở trang học sinh</a> <a class="btn" href="http://localhost:8000/results.html">Mở bảng điểm</a></p><pre>{html.escape(log)}</pre></div>'
        except Exception:
            msg = f'<div class="card bad"><h2>Lỗi khi tạo đề</h2><pre>{html.escape(traceback.format_exc())}</pre></div>'
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(page(msg).encode('utf-8'))

if __name__ == '__main__':
    url=f'http://localhost:{PORT}'
    print('Cong cu quan ly de V17 dang chay tai:', url)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer(('localhost', PORT), Handler).serve_forever()
