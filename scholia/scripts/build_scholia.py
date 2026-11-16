#!/usr/bin/env python3
"""Validate Scholia course data and compile it into one self-contained HTML file.

Usage:
    python3 build_scholia.py <course.json | course-folder> -o scholia-course.html
    python3 build_scholia.py <course.json | course-folder> --check

A course folder holds course.json (the "course" object, optionally "midterm"/"final"),
units/*.json (one Unit each, sorted by filename) and optionally midterm.json / final.json.
"""
import argparse
import base64
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
APP = ASSETS / "app"
KATEX = ASSETS / "vendor" / "katex"
PLACEHOLDER = "/*__SCHOLIA_DATA__*/null"
LANGS = {"zh-Hant", "zh-Hans", "en"}
QTYPES = {"single", "multi", "tf", "short"}


def load_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR {path}: invalid JSON at line {e.lineno} col {e.colno}: {e.msg}")


def load(src):
    src = Path(src)
    if src.is_file():
        return load_json(src)
    if not src.is_dir():
        sys.exit(f"ERROR: {src} not found")
    data = load_json(src / "course.json")
    units_dir = src / "units"
    if units_dir.is_dir():
        data["units"] = [load_json(p) for p in sorted(units_dir.glob("*.json"))]
    for key in ("midterm", "final"):
        p = src / f"{key}.json"
        if p.exists():
            data[key] = load_json(p)
    return data


class Checker:
    def __init__(self):
        self.errors, self.warnings = [], []

    def err(self, where, msg):
        self.errors.append(f"{where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{where}: {msg}")


def is_text(v):
    if isinstance(v, str):
        return v.strip() != ""
    if isinstance(v, dict) and v:
        return all(k in LANGS for k in v) and all(isinstance(x, str) for x in v.values())
    return False


def need_text(c, obj, key, where, required=True):
    if key not in obj or obj[key] in (None, ""):
        if required:
            c.err(where, f"missing '{key}'")
        return
    if not is_text(obj[key]):
        c.err(where, f"'{key}' must be a non-empty string or an object keyed by {sorted(LANGS)}")


def check_question(c, q, where, ids):
    if not isinstance(q, dict):
        c.err(where, "question must be an object")
        return
    qid = q.get("id")
    w = f"{where} [{qid}]"
    if not qid:
        c.err(where, "question missing 'id'")
    elif qid in ids:
        c.err(w, "duplicate question id")
    else:
        ids.add(qid)
    t = q.get("type")
    if t not in QTYPES:
        c.err(w, f"type must be one of {sorted(QTYPES)}, got {t!r}")
        return
    need_text(c, q, "stem", w)
    need_text(c, q, "explanation", w)
    if not q.get("concept"):
        c.warn(w, "no 'concept' — mistakes won't group into weak spots")
    ans = q.get("answer")
    if t in ("single", "multi"):
        opts = q.get("options")
        if not isinstance(opts, list) or len(opts) < 2:
            c.err(w, "needs 'options' with at least 2 entries")
            return
        n = len(opts)
        if t == "single":
            if not isinstance(ans, int) or isinstance(ans, bool) or not 0 <= ans < n:
                c.err(w, f"'answer' must be an option index 0..{n - 1}")
        else:
            if not isinstance(ans, list) or not ans or not all(isinstance(a, int) and 0 <= a < n for a in ans):
                c.err(w, f"'answer' must be a non-empty list of indices 0..{n - 1}")
        fb = q.get("optionFeedback")
        if fb is not None and (not isinstance(fb, list) or len(fb) != n):
            c.err(w, "'optionFeedback' must be a list the same length as 'options'")
        flat = [json.dumps(o, ensure_ascii=False, sort_keys=True) for o in opts]
        if len(set(flat)) != len(flat):
            c.err(w, "two options are identical")
        correct = ans if isinstance(ans, list) else [ans]
        if isinstance(fb, list) and len(fb) == n and all(isinstance(i, int) for i in correct):
            if any(fb[i] for i in correct if 0 <= i < n):
                c.warn(w, "optionFeedback explains the correct option as if it were wrong (use null there)")
    elif t == "tf":
        if not isinstance(ans, bool):
            c.err(w, "'answer' must be true or false")
    elif t == "short":
        if not is_text(ans):
            c.err(w, "'answer' must be the model answer text")


def check_difficulty(c, d, where):
    need_text(c, d, "title", where)
    need_text(c, d, "explanation", where)


CJK = re.compile(r"[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]")


def check_dollars(c, v, where="data"):
    """Warn about `$...$` pairs that look like two money amounts rather than a formula."""
    if isinstance(v, str):
        s = re.sub(r"\\\$", "", v)
        s = re.sub(r"\$\$.*?\$\$", "", s, flags=re.S)
        for m in re.finditer(r"\$([^$]*)\$", s):
            inner = m.group(1)
            bare = re.sub(r"\\text\{[^}]*\}", "", inner).strip()
            if CJK.search(bare) or re.search(r"[=+\-−×]$|(HK|US|NT|RMB)$", bare):
                c.warn(where, f"possible unescaped money amount (write \\\\$): …{m.group(0)[:40]}…")
                break
    elif isinstance(v, list):
        for i, x in enumerate(v):
            check_dollars(c, x, f"{where}[{i}]")
    elif isinstance(v, dict):
        for k, x in v.items():
            check_dollars(c, x, f"{where}.{k}")


NON_TEXT_KEYS = {"id", "type", "date", "scope", "units", "revealMode", "confidence", "kind", "lang",
                 "contentLangs", "difficulty", "timeLimitMin", "minutes"}


def missing_translations(v, langs, where, out):
    """Collect text fields that lack one of the requested content languages."""
    if isinstance(v, str):
        for l in langs[1:]:
            out.setdefault(l, []).append(where)
    elif isinstance(v, dict) and v and all(k in LANGS for k in v):
        for l in langs:
            if not v.get(l):
                out.setdefault(l, []).append(where)
    elif isinstance(v, dict):
        for k, x in v.items():
            if k in NON_TEXT_KEYS or (k == "answer" and not isinstance(x, (str, dict))):
                continue
            missing_translations(x, langs, f"{where}.{k}", out)
    elif isinstance(v, list):
        for i, x in enumerate(v):
            missing_translations(x, langs, f"{where}[{i}]", out)


def validate(data):
    c = Checker()
    check_dollars(c, data)
    course = data.get("course")
    if not isinstance(course, dict):
        c.err("course", "missing 'course' object")
        return c
    need_text(c, course, "title", "course")
    lang = course.get("lang", "zh-Hant")
    if lang not in LANGS:
        c.err("course", f"'lang' must be one of {sorted(LANGS)}")
    content_langs = course.get("contentLangs") or [lang]
    if any(l not in LANGS for l in content_langs):
        c.err("course", f"'contentLangs' entries must be in {sorted(LANGS)}")
    elif content_langs[0] != lang:
        c.err("course", "'contentLangs' must start with course.lang")
    elif len(content_langs) > 1:
        miss = {}
        for key in ("units", "midterm", "final"):
            if data.get(key) is not None:
                missing_translations(data[key], content_langs, key, miss)
        for l, paths in miss.items():
            c.warn("translations", f"{len(paths)} text fields have no '{l}' version, e.g. {', '.join(paths[:3])}")
    units = data.get("units") or []
    if not units:
        c.err("units", "no units")
    unit_ids, qids, hwids = set(), set(), set()
    for i, u in enumerate(units):
        uid = u.get("id")
        w = f"unit {i + 1} [{uid}]"
        if not uid:
            c.err(w, "missing 'id'")
        elif uid in unit_ids:
            c.err(w, "duplicate unit id")
        unit_ids.add(uid)
        need_text(c, u, "title", w)
        ps = u.get("prestudy")
        if not isinstance(ps, dict):
            c.err(w, "missing 'prestudy'")
        else:
            if not ps.get("objectives"):
                c.warn(w, "prestudy has no objectives")
            for j, s in enumerate(ps.get("sections") or []):
                need_text(c, s, "heading", f"{w} prestudy.sections[{j}]")
                need_text(c, s, "body", f"{w} prestudy.sections[{j}]")
            if not ps.get("sections"):
                c.err(w, "prestudy needs at least one section")
        for key, lo in (("prequiz", 4), ("postquiz", 4)):
            qs = u.get(key) or []
            if len(qs) < lo:
                c.warn(w, f"{key} has {len(qs)} questions (aim for 6–10)")
            for q in qs:
                check_question(c, q, f"{w} {key}", qids)
        for key in ("difficulties", "postDifficulties"):
            ds = u.get(key) or []
            if not ds:
                c.warn(w, f"no {key}")
            for j, d in enumerate(ds):
                check_difficulty(c, d, f"{w} {key}[{j}]")
        rv = u.get("review")
        if not isinstance(rv, dict):
            c.err(w, "missing 'review'")
        else:
            need_text(c, rv, "recap", f"{w} review")
            for j, fc in enumerate(rv.get("flashcards") or []):
                need_text(c, fc, "front", f"{w} review.flashcards[{j}]")
                need_text(c, fc, "back", f"{w} review.flashcards[{j}]")
        for j, h in enumerate(u.get("homework") or []):
            hw = f"{w} homework[{j}] [{h.get('id')}]"
            if not h.get("id"):
                c.err(hw, "missing 'id'")
            elif h["id"] in hwids:
                c.err(hw, "duplicate homework id")
            hwids.add(h.get("id"))
            need_text(c, h, "problem", hw)
            if not h.get("steps"):
                c.err(hw, "needs 'steps'")
            need_text(c, h, "answer", hw)
            if h.get("revealMode", "free") not in ("free", "hints-first"):
                c.err(hw, "'revealMode' must be 'free' or 'hints-first'")
            if h.get("revealMode") == "hints-first" and not h.get("hints"):
                c.err(hw, "'hints-first' needs at least one hint")
    for key in ("midterm", "final"):
        r = data.get(key)
        if r is None:
            continue
        w = key
        scope = r.get("scope") or []
        if not scope:
            c.err(w, "missing 'scope'")
        for s in scope:
            if s not in unit_ids:
                c.err(w, f"scope names unknown unit id {s!r}")
        need_text(c, r, "overview", w)
        exam = r.get("exam") or []
        if not exam:
            c.warn(w, "no exam questions")
        for q in exam:
            check_question(c, q, f"{w} exam", qids)
    return c


def katex_css():
    """KaTeX stylesheet with every font inlined as a woff2 data URI, so math renders offline."""
    css = (KATEX / "katex.min.css").read_text(encoding="utf-8")

    def font(m):
        name = m.group(1)
        data = base64.b64encode((KATEX / "fonts" / f"{name}.woff2").read_bytes()).decode()
        return f'src:url(data:font/woff2;base64,{data}) format("woff2")'

    return re.sub(r'src:url\(fonts/(KaTeX_[A-Za-z0-9_-]+)\.woff2\) format\("woff2"\)[^;}]*', font, css)


def assemble_template():
    """Join the app shell, stylesheet, translations, app code and KaTeX into one HTML template."""
    shell = (APP / "index.html").read_text(encoding="utf-8")
    parts = {
        "/*__KATEX_CSS__*/": katex_css(),
        "/*__STYLE__*/": (APP / "styles.css").read_text(encoding="utf-8"),
        "/*__KATEX_JS__*/": (KATEX / "katex.min.js").read_text(encoding="utf-8") + "\n"
                            + (KATEX / "auto-render.min.js").read_text(encoding="utf-8"),
        "/*__I18N__*/": (APP / "i18n.js").read_text(encoding="utf-8"),
        "/*__APP__*/": (APP / "app.js").read_text(encoding="utf-8"),
    }
    for marker, text in parts.items():
        if marker not in shell:
            sys.exit(f"ERROR: {marker} missing from assets/app/index.html")
        shell = shell.replace(marker, text.replace("</script", "<\\/script"), 1)
    return shell


IMG_REF = re.compile(r"!\[([^\]\n]*)\]\(([^)\s]+)\)")
IMG_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
             ".webp": "image/webp", ".svg": "image/svg+xml"}


def embed_images(data, base):
    """Replace ![alt](relative/path.png) in any text with a data: URI, so the site stays one file.

    Returns (errors, warnings, count). Paths are relative to the course folder (or to course.json's folder).
    """
    errors, warnings, count, cache = [], [], [0], {}

    def sub(m):
        alt, ref = m.group(1), m.group(2)
        if ref.startswith(("data:", "https://")):
            return m.group(0)
        f = (base / ref).resolve()
        mime = IMG_TYPES.get(f.suffix.lower())
        if not mime:
            errors.append(f"image {ref}: use one of {', '.join(sorted(IMG_TYPES))}")
            return m.group(0)
        if not f.is_file():
            errors.append(f"image {ref}: file not found (paths are relative to {base})")
            return m.group(0)
        if f not in cache:
            raw = f.read_bytes()
            if len(raw) > 600_000:
                warnings.append(f"image {ref} is {len(raw)//1024} KB; shrink it (the site gets slow above a few MB)")
            cache[f] = f"data:{mime};base64," + base64.b64encode(raw).decode()
        count[0] += 1
        return f"![{alt}]({cache[f]})"

    def walk(v):
        if isinstance(v, str):
            return IMG_REF.sub(sub, v) if "![" in v else v
        if isinstance(v, list):
            return [walk(x) for x in v]
        if isinstance(v, dict):
            return {k: walk(x) for k, x in v.items()}
        return v

    new = walk(data)
    data.clear()
    data.update(new)
    return errors, warnings, count[0]


def summary(data):
    """A compact map of an existing course: what to reuse when adding units without re-reading every file."""
    lang = data["course"].get("lang", "zh-Hant")

    def s(v):
        return v if isinstance(v, str) else (v or {}).get(lang) or next(iter((v or {"": ""}).values()))
    lines = [f"course: {s(data['course']['title'])}  lang={lang}  contentLangs={data['course'].get('contentLangs') or [lang]}"]
    for u in data.get("units") or []:
        qs = (u.get("prequiz") or []) + (u.get("postquiz") or [])
        concepts = sorted({s(q.get("concept")) for q in qs if q.get("concept")})
        hw = [h.get("id") for h in u.get("homework") or []]
        lines.append(f"{u['id']:>5}  {u.get('date', ''):10}  {s(u.get('title'))}")
        lines.append(f"       {len(qs)} questions (ids {qs[0]['id'] if qs else '-'} …)  homework: {', '.join(hw) or '-'}")
        lines.append(f"       concepts: {' | '.join(concepts)}")
    for k in ("midterm", "final"):
        if data.get(k):
            r = data[k]
            lines.append(f"{k}: scope={r.get('scope')} exam={len(r.get('exam') or [])} questions date={r.get('date', '-')}")
    return "\n".join(lines)


def build(data, out):
    tpl = assemble_template()
    if PLACEHOLDER not in tpl:
        sys.exit("ERROR: data placeholder missing from assets/app/index.html")
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    html = tpl.replace(PLACEHOLDER, payload, 1)
    title = data["course"]["title"]
    if isinstance(title, dict):
        title = title.get(data["course"].get("lang", "zh-Hant")) or next(iter(title.values()))
    html = html.replace("<title>Scholia</title>", f"<title>Scholia · {escape_html(title)}</title>", 1)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(html, encoding="utf-8")


def escape_html(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", help="course.json or a course folder")
    ap.add_argument("-o", "--out", help="output .html path")
    ap.add_argument("--check", action="store_true", help="validate only")
    ap.add_argument("--summary", action="store_true",
                    help="print unit ids, concepts and question ids (use before adding units)")
    a = ap.parse_args()
    data = load(a.src)
    if a.summary:
        print(summary(data))
        return
    src = Path(a.src)
    img_err, img_warn, nimg = embed_images(data, src if src.is_dir() else src.parent)
    c = validate(data)
    c.errors += img_err
    c.warnings += img_warn
    for w in c.warnings:
        print("warning", w)
    for e in c.errors:
        print("ERROR  ", e)
    units = data.get("units") or []
    nq = sum(len(u.get("prequiz") or []) + len(u.get("postquiz") or []) for u in units)
    print(f"{len(units)} units · {nq} unit questions{f' · {nimg} images' if nimg else ''}"
          f" · {len(c.errors)} errors · {len(c.warnings)} warnings")
    if c.errors:
        sys.exit(1)
    if a.check:
        return
    if not a.out:
        sys.exit("ERROR: give -o <output.html> (or --check)")
    build(data, a.out)
    print(f"built {a.out}")


if __name__ == "__main__":
    main()
