#!/usr/bin/env python3
"""Package the scholia/ skill folder into dist/scholia.skill (a zip archive).

Usage (from the repository root):
    python3 tools/package_skill.py            # writes dist/scholia.skill
    python3 tools/package_skill.py out.skill  # writes somewhere else
"""
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "scholia"
SKIP_DIRS = {"__pycache__", "node_modules"}
SKIP_FILES = {".DS_Store"}


def package(out=ROOT / "dist" / "scholia.skill"):
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in SKILL.rglob("*")
                   if p.is_file() and not (set(p.relative_to(SKILL).parts) & SKIP_DIRS)
                   and p.name not in SKIP_FILES and p.suffix != ".pyc")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, Path("scholia") / p.relative_to(SKILL))
    return out


if __name__ == "__main__":
    path = package(*(sys.argv[1:2]))
    print(f"wrote {path} ({path.stat().st_size // 1024} KB)")
