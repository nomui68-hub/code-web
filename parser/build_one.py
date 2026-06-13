# build_one.py
# Tạo 1 đề online từ 1 file TEX: sinh exams/<MA_DE>/questions.json và images/<MA_DE>/q*.png
import json, re, shutil, subprocess, sys
from pathlib import Path
import parser_v4

def safe_id(s):
    s=s.strip().upper()
    s=re.sub(r'[^A-Z0-9_-]+','_',s)
    return s or 'DE_MOI'

def build(tex_file, exam_id, title):
    root=Path(__file__).resolve().parents[1]
    tex_file=Path(tex_file)
    if not tex_file.is_absolute(): tex_file=root/tex_file
    exam_id=safe_id(exam_id)
    exam_dir=root/'exams'/exam_id
    img_dir=root/'images'/exam_id
    exam_dir.mkdir(parents=True,exist_ok=True); img_dir.mkdir(parents=True,exist_ok=True)
    data=parser_v4.parse(parser_v4.read_text(tex_file), exam_id)
    data['title']=title or exam_id
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
    exams=[e for e in index.get('exams',[]) if e.get('id')!=exam_id]
    exams.append({'id':exam_id,'title':title or exam_id,'file':f'exams/{exam_id}/questions.json','active':True})
    index['exams']=exams
    if not index.get('defaultExamId'): index['defaultExamId']=exam_id
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
    tex=sys.argv[1]; exam_id=sys.argv[2]; title=sys.argv[3] if len(sys.argv)>3 else exam_id
    build(tex,exam_id,title)
if __name__=='__main__': main()
