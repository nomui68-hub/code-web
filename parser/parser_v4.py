# parser_v4.py
import json,re,sys
from pathlib import Path

def read_text(p):
    for e in ('utf-8','utf-8-sig','cp1258','latin-1'):
        try: return Path(p).read_text(encoding=e)
        except UnicodeDecodeError: pass
    return Path(p).read_text(errors='ignore')

def rm_comments(tex):
    out=[]
    for line in tex.splitlines():
        s=[]; esc=False
        for ch in line:
            if ch=='\\' and not esc: esc=True; s.append(ch); continue
            if ch=='%' and not esc: break
            s.append(ch); esc=False
        out.append(''.join(s))
    return '\n'.join(out)

def brace(text,pos):
    while pos<len(text) and text[pos] != '{': pos+=1
    if pos>=len(text): return '',pos
    lev=0; res=[]; i=pos
    while i<len(text):
        ch=text[i]
        if ch=='{':
            lev+=1
            if lev>1: res.append(ch)
        elif ch=='}':
            lev-=1
            if lev==0: return ''.join(res), i+1
            res.append(ch)
        else: res.append(ch)
        i+=1
    return ''.join(res),i

def skip_opt(text,pos):
    while pos<len(text) and text[pos].isspace(): pos+=1
    if pos<len(text) and text[pos]=='[':
        lev=1; pos+=1
        while pos<len(text) and lev:
            if text[pos]=='[': lev+=1
            elif text[pos]==']': lev-=1
            pos+=1
    return pos

def flatten_immini(text):
    out=[]; i=0; key='\\immini'
    while True:
        p=text.find(key,i)
        if p<0: out.append(text[i:]); break
        out.append(text[i:p]); j=skip_opt(text,p+len(key)); a,j=brace(text,j); b,j=brace(text,j)
        out.append('\n'+a+'\n'+b+'\n'); i=j
    return ''.join(out)

def split_ex(tex): return re.findall(r'\\begin\{ex\}([\s\S]*?)\\end\{ex\}', tex)

def solution(block):
    p=block.find('\\loigiai')
    if p<0: return '',block
    s,e=brace(block,p); return s.strip(), block[:p]+block[e:]

def envs(text,env): return re.findall(r'\\begin\{'+re.escape(env)+r'\}[\s\S]*?\\end\{'+re.escape(env)+r'\}', text)

def visual(block):
    parts=[]
    for e in ('tikzpicture','tabular','tikzcd','array'):
        for part in envs(block,e):
            if e=='array':
                # Array thường nằm trong toán, khi render riêng cần bọc lại bằng \[...\]
                part='\\[\n'+part+'\n\\]'
            parts.append(part)
    uniq=[]
    for p in parts:
        if p not in uniq: uniq.append(p)
    return '\n\n'.join(uniq).strip()

def remove_visual(text):
    # Bỏ nguyên khối hình/bảng khỏi phần chữ câu hỏi, tránh sót \centerline{} rỗng.
    text=re.sub(r'\\begin\{center\}([\s\S]*?(tikzpicture|tabular|array|tkzTab)[\s\S]*?)\\end\{center\}','\n',text)
    text=re.sub(r'\\centerline\s*\{\s*(\\begin\{(?:tikzpicture|tabular|array)\}[\s\S]*?\\end\{(?:tikzpicture|tabular|array)\})\s*\}','\n',text)
    for e in ('tikzpicture','tabular','tikzcd','array'):
        text=re.sub(r'\\begin\{'+e+r'\}[\s\S]*?\\end\{'+e+r'\}','\n',text)
    text=re.sub(r'\\centerline\s*\{\s*\}','\n',text)
    return text

def split_math_segments(text):
    # Tách phần toán để không phá cú pháp MathJax khi xử lý lệnh định dạng chữ.
    pattern=r'(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))'
    return re.split(pattern, text)


def unwrap_format_commands_deep(text):
    r"""Gỡ \textbf, \textit, \emph... kể cả khi bên trong có công thức $...$.
    Dùng bộ đọc ngoặc brace() thay vì regex đơn giản để tránh sót lệnh.
    """
    cmds = {
        'textbf': ('strong','strong'), 'bf': ('strong','strong'),
        'textit': ('em','em'), 'emph': ('em','em'), 'it': ('em','em'), 'itshape': ('em','em'),
        'underline': ('u','u'), 'text': ('','')
    }
    out=[]; i=0
    n=len(text)
    while i<n:
        if text[i]=='\\':
            m=re.match(r'\\([A-Za-z]+)', text[i:])
            if m:
                name=m.group(1)
                if name in cmds:
                    j=i+len(name)+1
                    j=skip_opt(text,j)
                    k=j
                    while k<n and text[k].isspace(): k+=1
                    if k<n and text[k]=='{':
                        body,end=brace(text,k)
                        a,b=cmds[name]
                        out.append((f'<{a}>' if a else '') + body + (f'</{b}>' if b else ''))
                        i=end
                        continue
        out.append(text[i]); i+=1
    text=''.join(out)
    # Dạng nhóm chữ: {\it nội dung} hoặc {\bf nội dung}
    for _ in range(6):
        old=text
        text=re.sub(r'\{\s*\\(?:it|itshape)\s+([^{}]+?)\s*\}', r'<em>\1</em>', text)
        text=re.sub(r'\{\s*\\bf\s+([^{}]+?)\s*\}', r'<strong>\1</strong>', text)
        if text==old: break
    return text

def unwrap_text_commands_plain(t):
    # Các lệnh định dạng chữ ngoài môi trường toán.
    # Sửa lỗi hiện nguyên \textbf{...}, \textit{...}, {\it{...}} và lỗi dính chữ.
    for _ in range(12):
        old=t
        t=re.sub(r'\{\s*\\it\s*\{([^{}]*)\}\s*\}', r'<em>\1</em>', t)
        t=re.sub(r'\\textbf\s*\{([^{}]*)\}', r'<strong>\1</strong>', t)
        t=re.sub(r'\\(?:textit|emph)\s*\{([^{}]*)\}', r'<em>\1</em>', t)
        t=re.sub(r'\\(?:it|itshape)\s*\{([^{}]*)\}', r'<em>\1</em>', t)
        t=re.sub(r'\{\s*\\(?:it|itshape)\s+([^{}]+?)\s*\}', r'<em>\1</em>', t)
        t=re.sub(r'\\underline\s*\{([^{}]*)\}', r'<u>\1</u>', t)
        t=re.sub(r'\\text\s*\{([^{}]*)\}', r'\1', t)
        if t==old: break
    # Xóa ngoặc nhóm LaTeX chỉ dùng để định dạng chữ, không xóa ngoặc trong math vì math đã được tách.
    t=re.sub(r'\{\s*([^{}\\]*?)\s*\}', r'\1', t)
    return t

def clean_text_commands(text):
    parts=split_math_segments(text)
    out=[]
    for i,part in enumerate(parts):
        if i%2==1:
            out.append(part)
        else:
            out.append(unwrap_text_commands_plain(part))
    return ''.join(out)

def normalize_text_envs(text):
    """Chuyển các môi trường LaTeX văn bản sang HTML trước khi dọn ngoặc.
    Làm sớm để không bị biến \begin{center} thành \begincenter.
    """
    # center / flushleft / flushright: giữ nội dung, bỏ lệnh môi trường
    for env, cls in [('center','centered'), ('flushleft',''), ('flushright','')]:
        text = re.sub(r'\\begin\s*\{\s*'+env+r'\s*\}', '<div class="%s">' % cls if cls else '<br>', text)
        text = re.sub(r'\\end\s*\{\s*'+env+r'\s*\}', '</div>' if cls else '<br>', text)
    # itemize/enumerate/itimize: giữ nội dung, đổi \item thành bullet
    for env in ('itemize','enumerate','itimize','itemchoice'):
        text = re.sub(r'\\begin\s*\{\s*'+env+r'\s*\}', '<br>', text)
        text = re.sub(r'\\end\s*\{\s*'+env+r'\s*\}', '<br>', text)
    # eqnarray/align chỉ nên giữ phần toán gốc, tránh hiện begin/end ở text
    for env in (r'eqnarray\*?', r'align\*?', r'gather\*?'):
        text = re.sub(r'\\begin\s*\{\s*'+env+r'\s*\}', '<br>\\[', text)
        text = re.sub(r'\\end\s*\{\s*'+env+r'\s*\}', '\\]<br>', text)
    return text

def cleanup_latex_residue(text):
    # Dọn các vết sót do một số đề hoặc bản parser cũ có thể để lại.
    residues = {
        r'\\begincenter':'<div class="centered">', r'\\endcenter':'</div>',
        r'\\beginitemize':'<br>', r'\\enditemize':'<br>',
        r'\\beginenumerate':'<br>', r'\\endenumerate':'<br>',
        r'\\beginitimize':'<br>', r'\\enditimize':'<br>',
        r'\\beginitemchoice':'<br>', r'\\enditemchoice':'<br>',
    }
    for a,b in residues.items(): text=text.replace(a,b)
    text=re.sub(r'\\begin\s*\{\s*(center|itemize|enumerate|itimize|itemchoice|flushleft|flushright)\s*\}','<br>',text)
    text=re.sub(r'\\end\s*\{\s*(center|itemize|enumerate|itimize|itemchoice|flushleft|flushright)\s*\}','<br>',text)
    return text

def clean(text):
    text=remove_visual(text)
    text=re.sub(r'\\href\{[^{}]*\}\{[^{}]*\}','',text)
    text=re.sub(r'\\phantom\{[^{}]*\}','',text)
    text=normalize_text_envs(text)
    text=unwrap_format_commands_deep(text)
    text=clean_text_commands(text)
    text=cleanup_latex_residue(text)
    text=text.replace(r'\par','<br>')
    text=re.sub(r'\\itemch\s*','<br>• ',text)
    text=re.sub(r'\\item\s*','<br>• ',text)
    text=text.replace('\\\\','<br>')
    text=text.replace(r'\lq\lq','“').replace(r'\rq\rq','”').replace(r'\lq','‘').replace(r'\rq','’')
    text=text.replace('~',' ')
    text=re.sub(r'\\[,;:! ]',' ',text)
    text=re.sub(r'\\(quad|qquad)\b',' ',text)
    text=re.sub(r'\\(noindent|smallskip|medskip|bigskip)\b',' ',text)
    # Dọn lệnh kiểu \displaystyle, \limits ngoài math nếu bị sót ở text thường
    text=re.sub(r'\\(displaystyle|textstyle|scriptstyle|scriptscriptstyle)\b','',text)
    # Bảo toàn khoảng trắng quanh tag HTML để tránh dính chữ.
    text=re.sub(r'(?<=>)(?=\S)', ' ', text)
    text=re.sub(r'(?<=\S)(?=<)', ' ', text)
    text=re.sub(r'[ \t]+',' ',text)
    text=re.sub(r'\n\s*\n\s*\n+','\n\n',text)
    return text.strip()
def qtype(block):
    if '\\choiceTF' in block: return 'truefalse'
    if '\\choice' in block: return 'choice'
    if '\\shortans' in block: return 'short'
    return 'unknown'

def parse_choice(block):
    p=block.find('\\choice'); cur=p+7; opts=[]; ans=-1
    for k in range(4):
        o,cur=brace(block,cur)
        if '\\True' in o: ans=k; o=o.replace('\\True','')
        opts.append(clean(o))
    return {'type':'choice','question':clean(block[:p]),'options':opts,'answer':ans}

def parse_tf(block):
    p=block.find('\\choiceTF'); cur=p+9; sts=[]
    for k in range(4):
        s,cur=brace(block,cur); tr='\\True' in s; s=s.replace('\\True','')
        sts.append({'text':clean(s),'answer':tr})
    return {'type':'truefalse','question':clean(block[:p]),'statements':sts}

def parse_short(block):
    p=block.find('\\shortans'); a,_=brace(block,p+9)
    a=a.strip()
    if a.startswith('$') and a.endswith('$'): a=a[1:-1].strip()
    return {'type':'short','question':clean(block[:p]),'answer':a}

def parse(tex, exam_id='DE_MAU'):
    tex=flatten_immini(rm_comments(tex)); qs=[]; errs=[]
    for idx,orig in enumerate(split_ex(tex),1):
        try:
            sol,b=solution(orig); b=flatten_immini(b); vis=visual(b); typ=qtype(b)
            item = parse_choice(b) if typ=='choice' else parse_tf(b) if typ=='truefalse' else parse_short(b) if typ=='short' else None
            if not item: errs.append({'id':idx,'error':'unknown type'}); continue
            item.update({'id':idx,'solution':clean(sol),'visualLatex':vis,'visualBlocks':[vis] if vis else [],'hasTikz':'\\begin{tikzpicture}' in vis,'hasTable':'\\begin{tabular}' in vis,'hasImmini':'\\immini' in orig,'hasSolutionTikz':'\\begin{tikzpicture}' in sol,'rawType':typ,'needsImage':bool(vis),'image':f'images/q{idx}.png' if vis else None})
            qs.append(item)
        except Exception as e: errs.append({'id':idx,'error':str(e)})
    return {'examId':exam_id,'title':'Đề kiểm tra Toán','questions':qs,'errors':errs}

def main():
    if len(sys.argv)<3:
        print('Cach chay: python parser\\parser_v4.py tex\\de.tex data\\questions.json DE_MAU'); return
    inp,out=Path(sys.argv[1]),Path(sys.argv[2]); exam=sys.argv[3] if len(sys.argv)>3 else 'DE_MAU'
    data=parse(read_text(inp),exam); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Da tao',out); print('So cau:',len(data['questions'])); print('Loi:',data['errors'] or 'Khong co')
if __name__=='__main__': main()
