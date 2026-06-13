# render_visuals_v2.py
import json,re,shutil,subprocess,sys,tempfile
from pathlib import Path

def sanitize(s):
    s=re.sub(r'\\href\{[^{}]*\}\{\\tiny\s*\\phantom\{[^{}]*\}\}','',s or '')
    s=re.sub(r'\\href\{[^{}]*\}\{[^{}]*\}','',s)
    s=re.sub(r'\\phantom\{[A-Za-z0-9]+\}','',s)
    s=re.sub(r'\\node\s+at\s*\([^;]*?\)\s*\{\s*\}\s*;','',s)
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

def run(cmd,cwd): return subprocess.run(cmd,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,shell=False)

def render_one(q,outdir):
    body=q.get('visualLatex') or '\n\n'.join(q.get('visualBlocks',[]))
    if not body.strip(): return None
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); (td/'visual.tex').write_text(doc(body),encoding='utf-8')
        p=run(['pdflatex','-interaction=nonstopmode','-halt-on-error','visual.tex'],td)
        if p.returncode or not (td/'visual.pdf').exists():
            (outdir/f'q{q["id"]}_error.log').write_text(p.stdout,encoding='utf-8',errors='ignore'); return {'id':q['id'],'status':'latex_error'}
        pdf=outdir/f'q{q["id"]}.pdf'; png=outdir/f'q{q["id"]}.png'; shutil.copy(td/'visual.pdf',pdf)
        pp=shutil.which('pdftoppm')
        if pp:
            p2=run([pp,'-png','-singlefile','-r','200',str(pdf),str(outdir/f'q{q["id"]}')],Path.cwd())
            if p2.returncode==0 and png.exists(): q['image']=f'images/q{q["id"]}.png'; return {'id':q['id'],'status':'ok'}
        mg=shutil.which('magick')
        if mg:
            p3=run([mg,'-density','200',str(pdf),'-quality','95',str(png)],Path.cwd())
            if p3.returncode==0 and png.exists(): q['image']=f'images/q{q["id"]}.png'; return {'id':q['id'],'status':'ok'}
        return {'id':q['id'],'status':'pdf_only'}

def main():
    if len(sys.argv)<3:
        print('Cach chay: python parser\\render_visuals_v2.py data\\questions.json images'); return
    jp=Path(sys.argv[1]); out=Path(sys.argv[2]); out.mkdir(parents=True,exist_ok=True)
    data=json.loads(jp.read_text(encoding='utf-8'))
    res=[]
    for q in data.get('questions',[]):
        if q.get('visualLatex') or q.get('visualBlocks'): res.append(render_one(q,out))
    jp.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    for r in res: print(r)
    print('Da cap nhat',jp)
if __name__=='__main__': main()
