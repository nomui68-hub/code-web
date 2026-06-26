# build_one.py
# Tạo 1 đề online từ 1 file TEX: sinh exams/<MA_DE>/questions.json và images/<MA_DE>/q*.png
import json, re, shutil, subprocess, sys
from pathlib import Path
import parser_v4

def safe_id(s):
    s=s.strip().upper()
    s=re.sub(r'[^A-Z0-9_-]+','_',s)
    return s or 'DE_MOI'

def build(tex_file, exam_id, title, settings=None):
    root=Path(__file__).resolve().parents[1]
    tex_file=Path(tex_file)
    if not tex_file.is_absolute(): tex_file=root/tex_file
    exam_id=safe_id(exam_id)
    exam_dir=root/'exams'/exam_id
    img_dir=root/'images'/exam_id
    exam_dir.mkdir(parents=True,exist_ok=True); img_dir.mkdir(parents=True,exist_ok=True)
    data=parser_v4.parse(parser_v4.read_text(tex_file), exam_id)
    data['title']=title or exam_id
    if len(data.get('questions', [])) == 0:
        raise RuntimeError('LỖI PARSER: Không tạo được câu hỏi nào. Vui lòng kiểm tra file TEX hoặc gửi log cho ChatGPT. Lỗi: ' + json.dumps(data.get('errors', []), ensure_ascii=False))
    if settings:
        data['settings'] = settings
    for q in data.get('questions',[]):
        if q.get('image'):
            q['image']=f'images/{exam_id}/q{q["id"]}.png'
    out_json=exam_dir/'questions.json'
    out_json.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    # Render ảnh
    rv=root/'parser'/'render_visuals_v3.py'
    subprocess.run([sys.executable,str(rv),str(out_json),str(img_dir),f'images/{exam_id}'],check=False)
    # Cập nhật danh sách đề
    index_path=root/'exams'/'index.json'
    if index_path.exists():
        index=json.loads(index_path.read_text(encoding='utf-8'))
    else:
        index={'defaultExamId':exam_id,'exams':[]}
    # Cập nhật danh sách đề. Từ V14, học sinh chỉ thấy các đề giáo viên tạo,
    # không ưu tiên DE_MAU. DE_MAU vẫn có thể tồn tại làm dữ liệu mẫu nhưng được ẩn khỏi danh sách học sinh.
    exams=[e for e in index.get('exams',[]) if e.get('id')!=exam_id]
    item={'id':exam_id,'title':title or exam_id,'file':f'exams/{exam_id}/questions.json','active':True,'isGenerated':True}
    if settings: item['settings']=settings
    exams.append(item)
    # Giữ DE_MAU nếu có để giáo viên tham khảo, nhưng đánh dấu sample.
    for e in exams:
        if e.get('id') == 'DE_MAU':
            e['sample'] = True
            e['active'] = False
    index['exams']=exams
    generated=[e for e in exams if e.get('id')!='DE_MAU' and e.get('active') is not False]
    index['defaultExamId']=(generated[-1]['id'] if generated else (exams[0]['id'] if exams else exam_id))
    index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Da tao de:', exam_id)
    print('JSON:', out_json)
    print('Images:', img_dir)
    print('So cau:', len(data.get('questions',[])))
    if data.get('errors'): print('Loi parser:', data['errors'])

def main():
    if len(sys.argv)<3:
        print('Cach chay: python parser\\build_one.py tex\\DE01.tex DE01 "De kiem tra 01"')
        return
    tex=sys.argv[1]; exam_id=sys.argv[2]; title=sys.argv[3] if len(sys.argv)>3 and not sys.argv[3].startswith('--') else exam_id
    settings=None
    if '--config' in sys.argv:
        import json
        cfg=sys.argv[sys.argv.index('--config')+1]
        settings=json.loads(Path(cfg).read_text(encoding='utf-8'))
    build(tex,exam_id,title,settings)
if __name__=='__main__': main()
