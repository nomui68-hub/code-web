# teacher_manager.py
# Công cụ giáo viên V11-Python313: không dùng module cgi, chạy tốt với Python 3.13+
# Chạy: python teacher_manager.py rồi mở http://localhost:8123

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs
from email.parser import BytesParser
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
import webbrowser

ROOT = Path(__file__).resolve().parent
PORT = 8123

def safe_id(s):
    s = (s or '').strip().upper()
    s = re.sub(r'[^A-Z0-9_-]+', '_', s)
    return s or 'DE_MOI'

def page(msg=''):
    return f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>V11 - Quản lý đề thi</title><style>
body{{font-family:Arial, sans-serif;background:#f3f6fb;margin:0;color:#07142b}} .wrap{{max-width:1100px;margin:30px auto;padding:0 18px}}
.card{{background:white;border:1px solid #dbe5f3;border-radius:16px;padding:22px;margin:18px 0;box-shadow:0 8px 24px #0001}}
h1{{margin-top:0}} label{{font-weight:700;display:block;margin:12px 0 6px}} input,textarea,select{{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd7ea;border-radius:10px;font-size:16px}} textarea{{min-height:260px;font-family:Consolas,monospace}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}} .grid2{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}
.btn{{background:#1d5fb8;color:white;border:0;border-radius:10px;padding:13px 18px;font-weight:700;cursor:pointer}} .muted{{color:#5b6b83}} .ok{{background:#e9fbe9;border-left:5px solid #22a447;padding:12px}} .bad{{background:#fff0f0;border-left:5px solid #c93030;padding:12px}} pre{{white-space:pre-wrap;background:#0b1020;color:#d7e7ff;padding:14px;border-radius:10px;overflow:auto}}
.tabs{{display:flex;gap:10px;flex-wrap:wrap}} .tab{{padding:10px 14px;border-radius:999px;border:1px solid #cbd7ea;background:#f8fbff;cursor:pointer}} .tab.active{{background:#1d5fb8;color:white}}
.panel{{display:none}} .panel.active{{display:block}}
@media(max-width:800px){{.grid,.grid2{{grid-template-columns:1fr}}}}
</style></head><body><div class="wrap">
<div class="card"><h1>V11 - Quản lý đề thi Toán</h1><p class="muted">Công cụ này chạy trên máy giáo viên. Sau khi tạo đề, hệ thống tự cập nhật <b>exams/index.json</b>, sinh hình trong <b>images/</b> và cấu hình điểm/thời gian cho từng đề.</p></div>
{msg}
<form class="card" method="post" action="/build" enctype="multipart/form-data">
<h2>1. Chọn file đề hoặc dán code LaTeX</h2>
<div class="tabs"><button type="button" class="tab active" onclick="showTab('upload',this)">Tải file .tex lên</button><button type="button" class="tab" onclick="showTab('paste',this)">Dán code LaTeX</button></div>
<div id="upload" class="panel active"><label>Chọn file TEX dùng gói ex_test</label><input type="file" name="texfile" accept=".tex,text/plain"></div>
<div id="paste" class="panel"><label>Dán code LaTeX</label><textarea name="latexcode" placeholder="Dán toàn bộ code đề thi LaTeX ở đây..."></textarea></div>
<div class="grid2"><div><label>Mã đề</label><input name="exam_id" placeholder="VD: DE01" required></div><div><label>Tên đề hiển thị</label><input name="title" placeholder="VD: Kiểm tra cuối kì 1"></div></div>
<h2>2. Thời gian làm bài</h2>
<div class="grid"><div><label>Số phút làm bài</label><input type="number" name="duration" value="90" min="1"></div><div><label>Chỉ được nộp bài sau (phút)</label><input type="number" name="submit_after" value="0" min="0"></div><div><label>Số lần được làm bài</label><input type="number" name="attempts" value="1" min="1"></div></div>
<h2>3. Cấu hình điểm số</h2>
<div class="grid"><div><label>Trắc nghiệm: tổng điểm</label><input type="number" step="0.01" name="choice_total" value="3"></div><div><label>Trắc nghiệm: số câu</label><input type="number" name="choice_count" value="12"></div><div></div>
<div><label>Đúng/Sai: tổng điểm</label><input type="number" step="0.01" name="tf_total" value="4"></div><div><label>Đúng/Sai: số câu</label><input type="number" name="tf_count" value="4"></div><div><label>Cách chấm Đúng/Sai</label><select name="tf_mode"><option value="progressive">Lũy tiến: 10%, 25%, 50%, 100%</option><option value="equal">Chia đều: đúng mấy ý lấy mấy phần</option></select></div>
<div><label>Trả lời ngắn: tổng điểm</label><input type="number" step="0.01" name="short_total" value="3"></div><div><label>Trả lời ngắn: số câu</label><input type="number" name="short_count" value="6"></div><div></div></div>
<p><button class="btn" type="submit">Lưu bài và giao bài</button></p>
</form>
<form class="card" method="post" action="/build_all">
<h2>4. Quét toàn bộ đề trong thư mục tex</h2>
<p class="muted">Dùng khi thầy có nhiều file .tex trong thư mục <b>tex/</b>. Hệ thống sẽ tạo mỗi file thành một đề riêng và cập nhật danh sách đề cho học sinh chọn.</p>
<p><button class="btn" type="submit">Tạo tất cả đề trong thư mục tex</button></p>
</form>
<div class="card"><h2>5. Đưa đề lên GitHub</h2><p>Sau khi tạo xong, upload các thư mục/file sau lên GitHub để học sinh làm online:</p><pre>exams/
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
        'scoring': {
            'choiceTotal': float(read_field(fields,'choice_total','3') or 0),
            'choiceCount': int(float(read_field(fields,'choice_count','12') or 1)),
            'truefalseTotal': float(read_field(fields,'tf_total','4') or 0),
            'truefalseCount': int(float(read_field(fields,'tf_count','4') or 1)),
            'shortTotal': float(read_field(fields,'short_total','3') or 0),
            'shortCount': int(float(read_field(fields,'short_count','6') or 1)),
            'truefalseMode': read_field(fields,'tf_mode','progressive')
        }
    }
    cfg_dir = ROOT/'data'; cfg_dir.mkdir(exist_ok=True)
    cfg_path = cfg_dir/f'{exam_id}_settings.json'
    cfg_path.write_text(json.dumps(settings,ensure_ascii=False,indent=2),encoding='utf-8')
    cmd = [sys.executable, str(ROOT/'parser'/'build_one.py'), str(tex_path), exam_id, title, '--config', str(cfg_path)]
    proc = subprocess.run(cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    if proc.returncode not in (0,):
        raise RuntimeError(proc.stdout)
    return exam_id, title, proc.stdout

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
            else:
                fields, files = parse_post_form(self)
                exam_id,title,log = build_exam(fields, files)
                msg = f'<div class="card ok"><h2>Đã lưu bài và giao bài: {html.escape(title)}</h2><p>Mã đề: <b>{html.escape(exam_id)}</b></p><p><a class="btn" href="http://localhost:8000/index.html">Mở trang học sinh</a> <a class="btn" href="http://localhost:8000/results.html">Mở bảng điểm</a></p><pre>{html.escape(log)}</pre></div>'
        except Exception:
            msg = f'<div class="card bad"><h2>Lỗi khi tạo đề</h2><pre>{html.escape(traceback.format_exc())}</pre></div>'
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(page(msg).encode('utf-8'))

if __name__ == '__main__':
    url=f'http://localhost:{PORT}'
    print('Cong cu quan ly de V11-Python313 dang chay tai:', url)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer(('localhost', PORT), Handler).serve_forever()
