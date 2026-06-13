#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
parser_v2.py
Chuyển đề LaTeX dạng ex_test sang questions.json cho website thi trực tuyến.
Hỗ trợ chính:
- \begin{ex} ... \end{ex}
- \choice, \choice[2]
- \choiceTF
- \shortans{...}
- \True
- \loigiai{...}
- \immini[...]{...}{...}
- phát hiện tikzpicture, tabular

Cách chạy:
    python parser/parser_v2.py tex/de.tex data/questions.json
hoặc:
    python parser/parser_v2.py
mặc định đọc tex/de.tex và xuất data/questions.json.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def normalize_newlines(s: str) -> str:
    return s.replace("\r\n", "\n").replace("\r", "\n")


def strip_comments(tex: str) -> str:
    r"""Bỏ comment LaTeX nhưng giữ \% trong công thức."""
    out_lines = []
    for line in tex.splitlines():
        i = 0
        cut = len(line)
        while i < len(line):
            if line[i] == "%":
                # Đếm số dấu \ ngay trước %
                backslashes = 0
                j = i - 1
                while j >= 0 and line[j] == "\\":
                    backslashes += 1
                    j -= 1
                if backslashes % 2 == 0:
                    cut = i
                    break
            i += 1
        out_lines.append(line[:cut])
    return "\n".join(out_lines)


def find_matching_brace(text: str, open_pos: int) -> int:
    if open_pos < 0 or open_pos >= len(text) or text[open_pos] != "{":
        return -1
    level = 0
    i = open_pos
    while i < len(text):
        ch = text[i]
        if ch == "{":
            # bỏ qua \{ ? Thực tế đề hiếm dùng, nhưng xử lý tương đối
            if i > 0 and text[i - 1] == "\\":
                i += 1
                continue
            level += 1
        elif ch == "}":
            if i > 0 and text[i - 1] == "\\":
                i += 1
                continue
            level -= 1
            if level == 0:
                return i
        i += 1
    return -1


def extract_brace_after(text: str, pos: int) -> Tuple[str, int, int, int]:
    """Tìm khối {...} đầu tiên sau pos. Trả về content, vị trí sau }, open_pos, close_pos."""
    open_pos = text.find("{", pos)
    if open_pos == -1:
        return "", pos, -1, -1
    close_pos = find_matching_brace(text, open_pos)
    if close_pos == -1:
        return text[open_pos + 1 :], len(text), open_pos, -1
    return text[open_pos + 1 : close_pos], close_pos + 1, open_pos, close_pos


def skip_optional_args(text: str, pos: int) -> int:
    """Bỏ qua khoảng trắng và các [..] sau macro."""
    i = pos
    while True:
        while i < len(text) and text[i].isspace():
            i += 1
        if i < len(text) and text[i] == "[":
            level = 1
            i += 1
            while i < len(text) and level:
                if text[i] == "[":
                    level += 1
                elif text[i] == "]":
                    level -= 1
                i += 1
            continue
        return i


def extract_n_brace_blocks_after_macro(text: str, macro: str, n: int) -> Tuple[List[str], int, int]:
    pos = text.find(macro)
    if pos == -1:
        return [], -1, -1
    cursor = skip_optional_args(text, pos + len(macro))
    blocks: List[str] = []
    first_open = -1
    last_after = cursor
    for _ in range(n):
        content, after, open_pos, close_pos = extract_brace_after(text, cursor)
        if open_pos == -1:
            break
        if first_open == -1:
            first_open = open_pos
        blocks.append(content)
        cursor = after
        last_after = after
    return blocks, pos, last_after


def split_environment(tex: str, env: str) -> List[str]:
    r"""Tách các môi trường không lồng nhau \begin{env}...\end{env}."""
    begin = f"\\begin{{{env}}}"
    end = f"\\end{{{env}}}"
    blocks: List[str] = []
    pos = 0
    while True:
        b = tex.find(begin, pos)
        if b == -1:
            break
        content_start = b + len(begin)
        e = tex.find(end, content_start)
        if e == -1:
            break
        blocks.append(tex[content_start:e])
        pos = e + len(end)
    return blocks


def remove_solution(block: str) -> Tuple[str, str]:
    pos = block.find(r"\loigiai")
    if pos == -1:
        return block, ""
    content, after, open_pos, close_pos = extract_brace_after(block, pos + len(r"\loigiai"))
    before_after = block[:pos] + (block[after:] if after > pos else "")
    return before_after, content.strip()


def clean_latex_text(s: str) -> str:
    s = normalize_newlines(s)
    # Các macro chia phần không cần hiển thị
    s = re.sub(r"\\(cautn|cauds|caukq|caulc)\b", "", s)
    s = re.sub(r"\\Opensolutionfile\{[^}]*\}\[[^\]]*\]", "", s)
    s = re.sub(r"\\Closesolutionfile\{[^}]*\}", "", s)
    # Một số macro trình bày
    s = s.replace(r"\par", "\n")
    s = s.replace(r"\break", " ")
    s = re.sub(r"\\href\{[^}]*\}\{[^}]*\}", "", s)
    # nén dòng trống
    s = re.sub(r"\n\s*\n\s*\n+", "\n\n", s)
    return s.strip()


def extract_immini(block: str) -> Tuple[Optional[str], Optional[str], str]:
    r"""Nếu có \immini, trả về (text_part, visual_part, original_or_rebuilt)."""
    pos = block.find(r"\immini")
    if pos == -1:
        return None, None, block
    cursor = skip_optional_args(block, pos + len(r"\immini"))
    first, after1, _, _ = extract_brace_after(block, cursor)
    second, after2, _, _ = extract_brace_after(block, after1)
    if not first:
        return None, None, block
    # Ghép phần trước immini + nội dung chữ + phần sau 2 ngoặc (nếu có)
    rebuilt = block[:pos] + "\n" + first + "\n" + block[after2:]
    return first, second, rebuilt


def find_question_until(block: str, markers: List[str]) -> str:
    positions = [block.find(m) for m in markers if block.find(m) != -1]
    if not positions:
        return block
    return block[: min(positions)]


def parse_choice(block: str) -> Dict[str, Any]:
    text_part, visual_part, work = extract_immini(block)
    blocks, pos, after = extract_n_brace_blocks_after_macro(work, r"\choice", 4)
    answer = -1
    options = []
    for i, opt in enumerate(blocks):
        if r"\True" in opt:
            answer = i
            opt = opt.replace(r"\True", "")
        options.append(clean_latex_text(opt))
    question = find_question_until(work, [r"\choice"])
    return {
        "type": "choice",
        "question": clean_latex_text(question),
        "options": options,
        "answer": answer,
        "visualLatex": clean_latex_text(visual_part or ""),
    }


def parse_truefalse(block: str) -> Dict[str, Any]:
    text_part, visual_part, work = extract_immini(block)
    blocks, pos, after = extract_n_brace_blocks_after_macro(work, r"\choiceTF", 4)
    statements = []
    for st in blocks:
        truth = r"\True" in st
        st = st.replace(r"\True", "")
        statements.append({"text": clean_latex_text(st), "answer": truth})
    question = find_question_until(work, [r"\choiceTF"])
    return {
        "type": "truefalse",
        "question": clean_latex_text(question),
        "statements": statements,
        "visualLatex": clean_latex_text(visual_part or ""),
    }


def normalize_short_answer(ans: str) -> str:
    ans = ans.strip()
    # Bỏ $...$ ngoài cùng nếu có
    if ans.startswith("$") and ans.endswith("$") and len(ans) >= 2:
        ans = ans[1:-1].strip()
    return ans


def parse_short(block: str) -> Dict[str, Any]:
    text_part, visual_part, work = extract_immini(block)
    ans, pos, after = extract_n_brace_blocks_after_macro(work, r"\shortans", 1)
    answer = normalize_short_answer(ans[0]) if ans else ""
    question = find_question_until(work, [r"\shortans"])
    return {
        "type": "short",
        "question": clean_latex_text(question),
        "answer": answer,
        "visualLatex": clean_latex_text(visual_part or ""),
    }


def detect_type(block: str) -> str:
    if r"\choiceTF" in block:
        return "truefalse"
    if r"\shortans" in block:
        return "short"
    if r"\choice" in block:
        return "choice"
    return "unknown"


def parse_tex(tex: str, exam_id: str = "DE001") -> Dict[str, Any]:
    tex = normalize_newlines(tex)
    tex_no_comments = strip_comments(tex)
    exercises = split_environment(tex_no_comments, "ex")
    questions: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    for idx, raw in enumerate(exercises, start=1):
        raw_wo_solution, solution = remove_solution(raw)
        qtype = detect_type(raw_wo_solution)
        try:
            if qtype == "choice":
                item = parse_choice(raw_wo_solution)
            elif qtype == "truefalse":
                item = parse_truefalse(raw_wo_solution)
            elif qtype == "short":
                item = parse_short(raw_wo_solution)
            else:
                errors.append({"id": idx, "error": "Không nhận diện được dạng câu", "preview": raw[:200]})
                continue
            item["id"] = idx
            item["solution"] = clean_latex_text(solution)
            full_for_flags = raw
            item["hasTikz"] = r"\begin{tikzpicture}" in full_for_flags or r"\begin{tikzpicture}" in item.get("visualLatex", "")
            item["hasImmini"] = r"\immini" in full_for_flags
            item["hasTable"] = r"\begin{tabular}" in full_for_flags
            item["hasSolutionTikz"] = r"\begin{tikzpicture}" in solution
            item["image"] = None
            item["rawType"] = qtype
            # kiểm tra sơ bộ
            if qtype == "choice" and (len(item.get("options", [])) != 4 or item.get("answer", -1) < 0):
                item["warning"] = "Câu trắc nghiệm chưa đủ 4 lựa chọn hoặc chưa có \\True"
            if qtype == "truefalse" and len(item.get("statements", [])) != 4:
                item["warning"] = "Câu đúng/sai chưa đủ 4 mệnh đề"
            questions.append(item)
        except Exception as exc:
            errors.append({"id": idx, "error": repr(exc), "preview": raw[:300]})
    return {
        "examId": exam_id,
        "title": "Đề thi trực tuyến",
        "source": "LaTeX",
        "count": len(questions),
        "questions": questions,
        "errors": errors,
    }


def main() -> None:
    in_path = Path(sys.argv[1]) if len(sys.argv) >= 2 else Path("tex/de.tex")
    out_path = Path(sys.argv[2]) if len(sys.argv) >= 3 else Path("data/questions.json")
    exam_id = sys.argv[3] if len(sys.argv) >= 4 else in_path.stem
    if not in_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file: {in_path}")
    tex = in_path.read_text(encoding="utf-8", errors="replace")
    data = parse_tex(tex, exam_id=exam_id)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Đã xuất: {out_path}")
    print(f"Số câu đọc được: {data['count']}")
    print(f"Số lỗi: {len(data['errors'])}")
    if data["errors"]:
        print("Một số lỗi đầu tiên:")
        for e in data["errors"][:5]:
            print("-", e)


if __name__ == "__main__":
    main()
