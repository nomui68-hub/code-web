# build_all.py
# Quét tất cả file .tex trong thư mục tex/ và sinh thành nhiều đề online.
from pathlib import Path
import subprocess, sys, re

def safe_id(name):
    s=name.upper()
    s=re.sub(r'[^A-Z0-9_-]+','_',s)
    return s or 'DE_MOI'

def main():
    root=Path(__file__).resolve().parents[1]
    tex_dir=root/'tex'
    files=sorted(tex_dir.glob('*.tex'))
    if not files:
        print('Khong co file .tex trong thu muc tex')
        return
    for f in files:
        # V14: bỏ qua de.tex/DE_MAU khi quét hàng loạt để học sinh không luôn thấy đề mẫu.
        if f.name.lower() in ('de.tex','de_mau.tex','de-mau.tex'):
            print('Bo qua file de mau:', f.name)
            continue
        exam_id=safe_id(f.stem)
        title=f.stem.replace('_',' ').replace('-',' ')
        print('\n=== Build', exam_id, '===')
        subprocess.run([sys.executable, str(root/'parser'/'build_one.py'), str(f), exam_id, title], check=False)
    print('\nDa build xong tat ca de trong thu muc tex/')
if __name__=='__main__': main()
