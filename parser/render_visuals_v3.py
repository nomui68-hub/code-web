# render_visuals_v3.py
# Xuất hình/bảng/TikZ cho từng đề vào images/<MA_DE>/qN.png và cập nhật questions.json.
import json,re,shutil,subprocess,sys,tempfile
from pathlib import Path

def sanitize(s):
    s = s or ''
    # Bỏ mã rác do một số nguồn đề chèn \href{...}{\tiny\phantom{...}} làm lỗi render.
    s=re.sub(r'\\href\{[^{}]*\}\{\s*\\tiny\s*\\phantom\{[^{}]*\}\s*\}','',s)
    s=re.sub(r'\\href\{[^{}]*\}\{[^{}]*\}','',s)
    s=re.sub(r'\\phantom\{[^{}]*\}','',s)
    s=re.sub(r'\\node\s+at\s*\([^;]*?\)\s*\{\s*\}\s*;','',s)
    # Giảm các vòng lặp quá nặng, ví dụ \foreach \i in {1,...,500} gây chậm hoặc lỗi render.
    def _cap_loop(m):
        var=m.group(1); n=int(m.group(2));
        return f'\\foreach {var} in {{1,...,{min(n,80)}}}'
    s=re.sub(r'\\foreach\s+(\\\w+)\s+in\s*\{1,\.\.\.,(\d+)\}', _cap_loop, s)
    return s

def doc(body):
    return r'''
\documentclass[tikz,border=3mm]{standalone}
\usepackage[utf8]{vietnam}
\usepackage{amsmath,amssymb,mathrsfs}
\usepackage{tikz,tkz-euclide,tkz-tab,tabvar,pgfplots}
\pgfplotsset{compat=1.18}
\usetikzlibrary{arrows,arrows.meta,calc,intersections,angles,quotes,patterns,decorations.markings,decorations.pathmorphing,decorations.text,backgrounds,positioning,shapes.geometric}
\begin{document}
\begin{minipage}{0.98\linewidth}
\centering
'''+sanitize(body)+r'''
\end{minipage}
\end{document}
'''

def run(cmd,cwd):
    return subprocess.run(cmd,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,shell=False)

def render_one(q,outdir,url_prefix):
    body=q.get('visualLatex') or '\n\n'.join(q.get('visualBlocks',[]))
    if not body.strip(): return None
    outdir.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); (td/'visual.tex').write_text(doc(body),encoding='utf-8')
        p=run(['pdflatex','-interaction=nonstopmode','-halt-on-error','visual.tex'],td)
        if p.returncode or not (td/'visual.pdf').exists():
            (outdir/f'q{q["id"]}_error.log').write_text(p.stdout,encoding='utf-8',errors='ignore')
            return {'id':q['id'],'status':'latex_error'}
        pdf=outdir/f'q{q["id"]}.pdf'; png=outdir/f'q{q["id"]}.png'; shutil.copy(td/'visual.pdf',pdf)
        pp=shutil.which('pdftoppm')
        if pp:
            p2=run([pp,'-png','-singlefile','-r','200',str(pdf),str(outdir/f'q{q["id"]}')],Path.cwd())
            if p2.returncode==0 and png.exists():
                q['image']=f'{url_prefix}/q{q["id"]}.png'
                return {'id':q['id'],'status':'ok'}
        mg=shutil.which('magick')
        if mg:
            p3=run([mg,'-density','200',str(pdf),'-quality','95',str(png)],Path.cwd())
            if p3.returncode==0 and png.exists():
                q['image']=f'{url_prefix}/q{q["id"]}.png'
                return {'id':q['id'],'status':'ok'}
        q['image']=f'{url_prefix}/q{q["id"]}.pdf'
        return {'id':q['id'],'status':'pdf_only'}

def main():
    if len(sys.argv)<3:
        print('Cach chay: python parser\\render_visuals_v3.py exams\\DE_MAU\\questions.json images\\DE_MAU images/DE_MAU')
        return
    jp=Path(sys.argv[1]); out=Path(sys.argv[2]); url_prefix=sys.argv[3] if len(sys.argv)>3 else str(out).replace('\\','/')
    data=json.loads(jp.read_text(encoding='utf-8'))
    res=[]
    for q in data.get('questions',[]):
        if q.get('visualLatex') or q.get('visualBlocks'):
            res.append(render_one(q,out,url_prefix))
    jp.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    for r in res: print(r)
    print('Da cap nhat',jp)
if __name__=='__main__': main()
