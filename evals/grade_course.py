#!/usr/bin/env python3
"""Mechanically grade a Scholia course folder against the content guide.

Covers the expectations a script can check (validation, counts, languages, citations). Judgement
calls such as "the distractors are real misconceptions" or "the wrong answer key was caught" still need
a human or model grader reading the output.

Usage (from the repository root):
    python3 evals/grade_course.py COURSE_DIR [--lang zh-Hant] [--langs zh-Hant,en] [--units N] [--json out.json]

Exit status is 1 when any check fails.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scholia" / "scripts"))
import build_scholia as bs  # noqa: E402

RANGES = {  # content-guide.md, per unit: (path, low, high)
    "prestudy.objectives": (2, 4), "prestudy.sections": (2, 4), "prequiz": (6, 10),
    "difficulties": (2, 4), "review.keyPoints": (4, 8), "review.flashcards": (8, 15),
    "postquiz": (6, 10), "postDifficulties": (2, 4),
}
SIMPLIFIED = set("们这说时对会过还没为学习课应该问题门车东见长机经济价钱厂产")
NOT_HK = ("概率", "作业", "复习", "软件包")


def get(d, path):
    for k in path.split("."):
        d = (d or {}).get(k) if isinstance(d, dict) else None
    return d


def texts(x, lang=None):
    """Yield every string in x; for bilingual objects only the given language."""
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        if lang and x and set(x) <= bs.LANGS:
            if isinstance(x.get(lang), str):
                yield x[lang]
            return
        for v in x.values():
            yield from texts(v, lang)
    elif isinstance(x, list):
        for v in x:
            yield from texts(v, lang)


def questions(unit):
    return (unit.get("prequiz") or []) + (unit.get("postquiz") or [])


def grade(course_dir, lang=None, langs=None, units=None):
    data = bs.load(Path(course_dir))
    v = bs.validate(data)
    checks = []

    def check(text, passed, evidence=""):
        checks.append({"text": text, "passed": bool(passed), "evidence": evidence})

    check("validation reports 0 errors", not v.errors, "; ".join(v.errors[:5]))
    money = [w for w in v.warnings if "money" in w]
    check("no unescaped-money warnings", not money, "; ".join(money[:3]))
    course = data["course"]
    content_langs = course.get("contentLangs") or [course.get("lang")]
    if lang:
        check(f"course.lang is {lang}", course.get("lang") == lang, str(course.get("lang")))
    if langs:
        want = set(langs)
        check(f"contentLangs covers {sorted(want)}", want <= set(content_langs), str(content_langs))
        missing = [w for w in v.warnings if "version" in w]
        check("no missing-translation warnings", not missing, "; ".join(missing[:3]))
    us = data.get("units") or []
    if units is not None:
        check(f"{units} unit(s)", len(us) == units, str(len(us)))

    for u in us:
        uid = u.get("id")
        for path, (lo, hi) in RANGES.items():
            n = len(get(u, path) or [])
            check(f"{uid}: {path} has {lo}-{hi}", lo <= n <= hi, str(n))
        qs = questions(u)
        no_concept = [q.get("id") for q in qs if not q.get("concept")]
        check(f"{uid}: every question has a concept", not no_concept, ", ".join(map(str, no_concept[:5])))
        concepts = {json.dumps(q.get("concept"), ensure_ascii=False) for q in qs if q.get("concept")}
        check(f"{uid}: at most 8 distinct concepts", len(concepts) <= 8, str(len(concepts)))
        cited = [x for x in (get(u, "prestudy.sections") or []) + qs + (u.get("difficulties") or [])
                 + (u.get("postDifficulties") or []) if isinstance(x, dict)]
        share = sum(1 for x in cited if x.get("source")) / max(1, len(cited))
        check(f"{uid}: at least half of sections/questions/difficulties cite a source", share >= .5, f"{share:.0%}")
        for h in u.get("homework") or []:
            ok = all(h.get(k) for k in ("problem", "steps", "answer"))
            check(f"{uid}: homework {h.get('id')} has problem, steps and answer", ok)

    if "zh-Hant" in content_langs:
        zh = "".join(texts({k: data[k] for k in ("course", "units", "midterm", "final") if k in data}, "zh-Hant"))
        if len(content_langs) == 1:  # plain strings are zh-Hant; skip English-looking ones
            zh = "".join(t for t in texts(data) if re.search(r"[一-鿿]", t))
        bad = sorted({c for c in zh if c in SIMPLIFIED})
        check("zh-Hant text has no Simplified characters", not bad, "".join(bad))
        terms = [t for t in NOT_HK if t in zh]
        check("zh-Hant text uses HK terms", not terms, ", ".join(terms))
    return {"course": course.get("title"), "passed": all(c["passed"] for c in checks),
            "summary": f"{sum(c['passed'] for c in checks)}/{len(checks)} checks passed", "checks": checks}


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("course")
    ap.add_argument("--lang")
    ap.add_argument("--langs", type=lambda s: s.split(","))
    ap.add_argument("--units", type=int)
    ap.add_argument("--json", help="write the full report here")
    a = ap.parse_args()
    r = grade(a.course, a.lang, a.langs, a.units)
    for c in r["checks"]:
        if not c["passed"]:
            print(f"FAIL  {c['text']}" + (f"  ({c['evidence']})" if c["evidence"] else ""))
    print(r["summary"])
    if a.json:
        Path(a.json).write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
    sys.exit(0 if r["passed"] else 1)


if __name__ == "__main__":
    main()
