#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
render_visuals.py
Đọc data/questions.json, biên dịch các visualBlocks LaTeX thành ảnh PNG trong thư mục images,
rồi cập nhật lại trường image trong questions.json.

Chạy từ thư mục gốc math-exam-v2:
    python parser/render_visuals.py data/questions.json images

Yêu cầu máy đã cài TeX Live/MiKTeX có pdflatex.
Nếu có pdftocairo thì xuất PNG tự động. Nếu không, script vẫn tạo file .tex/.pdf tạm để kiểm tra.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List

PREAMBLE = r'''
\documentclass[border=6pt]{standalone}
\usepackage[utf8]{vietnam}
\usepackage{amsmath,amssymb,mathrsfs}
\usepackage{tikz,tkz-euclide,tikz-3dplot,tkz-tab,tabvar}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usetikzlibrary{arrows,arrows.meta,calc,intersections,angles,quotes,patterns,patterns.meta,decorations.markings,decorations.pathmorphing,backgrounds,shapes.geometric}
\usepackage{array,tabularx,multirow,makecell}
\begin{document}
'''

POSTAMBLE = r'''
\end{document}
'''


def run(cmd: List[str], cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=str(cwd), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=60)


def wrap_block(blocks: List[str]) -> str:
    body = "\n\n".join(blocks)
    # Nếu block là center thì standalone vẫn xử lý được. Nếu chỉ là tabular/tikz thì cũng OK.
    return PREAMBLE + "\n" + body + "\n" + POSTAMBLE


def render_one(qid: int, blocks: List[str], out_dir: Path) -> str | None:
    if not blocks:
        return None
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        tex_path = tmp / f"q{qid}.tex"
        tex_path.write_text(wrap_block(blocks), encoding="utf-8")
        pdflatex = shutil.which("pdflatex")
        if not pdflatex:
            print(f"[q{qid}] Không tìm thấy pdflatex")
            return None
        r = run([pdflatex, "-interaction=nonstopmode", tex_path.name], tmp)
        pdf_path = tmp / f"q{qid}.pdf"
        if not pdf_path.exists():
            log_path = out_dir / f"q{qid}_error.log"
            log_path.write_text(r.stdout, encoding="utf-8", errors="replace")
            print(f"[q{qid}] Lỗi biên dịch. Xem {log_path}")
            return None
        out_dir.mkdir(parents=True, exist_ok=True)
        rel_name = f"q{qid}.png"
        png_path = out_dir / rel_name
        pdftocairo = shutil.which("pdftocairo")
        if pdftocairo:
            out_prefix = out_dir / f"q{qid}"
            r2 = run([pdftocairo, "-png", "-singlefile", "-r", "180", str(pdf_path), str(out_prefix)], tmp)
            if png_path.exists():
                print(f"[q{qid}] OK -> {png_path}")
                return f"images/{rel_name}"
            print(f"[q{qid}] pdftocairo lỗi: {r2.stdout[:200]}")
        # fallback: chép PDF để người dùng tự xem
        pdf_out = out_dir / f"q{qid}.pdf"
        shutil.copy2(pdf_path, pdf_out)
        print(f"[q{qid}] Đã tạo PDF, chưa tạo được PNG: {pdf_out}")
        return f"images/q{qid}.pdf"


def main() -> None:
    json_path = Path(sys.argv[1]) if len(sys.argv) >= 2 else Path("data/questions.json")
    out_dir = Path(sys.argv[2]) if len(sys.argv) >= 3 else Path("images")
    data: Dict[str, Any] = json.loads(json_path.read_text(encoding="utf-8"))
    questions = data.get("questions", data if isinstance(data, list) else [])
    count = 0
    for q in questions:
        blocks = q.get("visualBlocks") or []
        if not blocks:
            continue
        img = render_one(int(q["id"]), blocks, out_dir)
        if img:
            q["image"] = img
            count += 1
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Đã cập nhật {count} ảnh vào {json_path}")


if __name__ == "__main__":
    main()
