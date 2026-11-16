"""Tests for the Scholia build script and the generated study site.

Run from the repository root:
    python3 -m unittest discover -s tests -v

The browser test needs Google Chrome or Chromium; it is skipped when neither is installed.
"""
import copy
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "scholia"
EXAMPLE = SKILL / "references" / "example-course"
sys.path.insert(0, str(SKILL / "scripts"))
import build_scholia as bs  # noqa: E402


def example_data():
    return bs.load(EXAMPLE)


def messages(data):
    c = bs.validate(data)
    return c.errors, c.warnings


class ValidationTests(unittest.TestCase):
    def test_example_course_is_valid(self):
        errors, _ = messages(example_data())
        self.assertEqual(errors, [])

    def test_answer_index_out_of_range(self):
        d = example_data()
        d["units"][0]["prequiz"][0]["answer"] = 9
        errors, _ = messages(d)
        self.assertTrue(any("answer" in e for e in errors), errors)

    def test_duplicate_question_id(self):
        d = example_data()
        d["units"][0]["prequiz"][1]["id"] = d["units"][0]["prequiz"][0]["id"]
        errors, _ = messages(d)
        self.assertTrue(any("duplicate question id" in e for e in errors), errors)

    def test_identical_options(self):
        d = example_data()
        q = d["units"][0]["prequiz"][0]
        q["options"][2] = q["options"][3]
        errors, _ = messages(d)
        self.assertTrue(any("identical" in e for e in errors), errors)

    def test_review_scope_unknown_unit(self):
        d = example_data()
        d["midterm"]["scope"].append("u99")
        errors, _ = messages(d)
        self.assertTrue(any("u99" in e for e in errors), errors)

    def test_unescaped_money_warns(self):
        d = example_data()
        d["units"][0]["summary"] = "價格由 $100 跌至 $80"
        _, warnings = messages(d)
        self.assertTrue(any("money" in w for w in warnings), warnings)

    def test_math_with_chinese_text_does_not_warn(self):
        d = example_data()
        d["units"][0]["summary"] = "使用率 $= \\frac{\\text{實際產量}}{\\text{設計產能}}$，以及 $x^2$"
        _, warnings = messages(d)
        self.assertFalse(any("money" in w for w in warnings), warnings)

    def test_missing_translations_are_counted(self):
        d = example_data()
        d["course"]["contentLangs"] = ["zh-Hant", "en"]
        _, warnings = messages(d)
        self.assertTrue(any("no 'en' version" in w for w in warnings), warnings)

    def test_content_langs_must_start_with_lang(self):
        d = example_data()
        d["course"]["contentLangs"] = ["en", "zh-Hant"]
        errors, _ = messages(d)
        self.assertTrue(any("contentLangs" in e for e in errors), errors)


class ImageAndSummaryTests(unittest.TestCase):
    def test_example_figure_is_embedded(self):
        d = example_data()
        errors, _, n = bs.embed_images(d, EXAMPLE)
        self.assertEqual(errors, [])
        self.assertGreaterEqual(n, 1)
        self.assertIn("data:image/svg+xml;base64,", json.dumps(d))

    def test_missing_image_is_an_error(self):
        d = example_data()
        d["units"][0]["summary"] = "![x](figures/nope.png)"
        errors, _, _ = bs.embed_images(d, EXAMPLE)
        self.assertTrue(any("not found" in e for e in errors), errors)

    def test_summary_lists_units_and_concepts(self):
        out = bs.summary(example_data())
        self.assertIn("u1", out)
        self.assertIn("concepts:", out)


class BuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp())
        cls.out = cls.tmp / "site.html"
        cls.data = example_data()
        data = copy.deepcopy(cls.data)
        bs.embed_images(data, EXAMPLE)
        bs.build(data, cls.out)
        cls.html = cls.out.read_text(encoding="utf-8")

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_all_markers_replaced(self):
        self.assertNotRegex(self.html, r"/\*__[A-Z0-9_]+__\*/")

    def test_course_data_embedded(self):
        m = re.search(r"const DATA = (\{.*?\});\n", self.html, re.S)
        self.assertIsNotNone(m)
        embedded = json.loads(m.group(1).replace("<\\/", "</"))
        self.assertEqual(embedded["course"]["title"], self.data["course"]["title"])

    def test_math_works_offline(self):
        self.assertNotIn("cdnjs", self.html)
        self.assertNotIn("url(fonts/", self.html)
        self.assertIn("data:font/woff2;base64,", self.html)
        self.assertIn("renderMathInElement", self.html)

    def test_no_stray_closing_script_tags(self):
        self.assertEqual(self.html.count("</script"), 2)

    def test_title_set(self):
        self.assertIn("<title>Scholia · ", self.html)

    def test_published_copies_are_current(self):
        # build/scholia-example.html and the GitHub Pages demo must match a fresh build
        for p in (ROOT / "build" / "scholia-example.html", ROOT / "docs" / "index.html"):
            self.assertEqual(p.read_text(encoding="utf-8"), self.html,
                             f"{p.relative_to(ROOT)} is stale; rebuild the example course")


def find_chrome():
    for c in (os.environ.get("CHROME"), "google-chrome", "google-chrome-stable", "chromium", "chromium-browser",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"):
        if c and (shutil.which(c) or Path(c).exists()):
            return shutil.which(c) or c
    return None


@unittest.skipUnless(find_chrome(), "Chrome/Chromium not installed")
class BrowserTests(unittest.TestCase):
    """Load the built site in headless Chrome and check that the app actually renders."""

    def dump(self, html_path, fragment=""):
        chrome = find_chrome()
        with tempfile.TemporaryDirectory() as profile:
            r = subprocess.run([chrome, "--headless=new", "--disable-gpu", "--no-sandbox",
                                f"--user-data-dir={profile}", "--virtual-time-budget=4000", "--dump-dom",
                                html_path.as_uri() + fragment], capture_output=True, text=True, timeout=120)
        return r.stdout

    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp())
        cls.out = cls.tmp / "site.html"
        data = example_data()
        bs.embed_images(data, EXAMPLE)
        bs.build(data, cls.out)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_dashboard_renders(self):
        dom = self.dump(self.out)
        self.assertIn('class="stages"', dom)
        self.assertIn("unitcard", dom)

    def test_unit_page_renders_math(self):
        dom = self.dump(self.out, "#/u/u1/prestudy")
        self.assertIn('class="katex"', dom)
        self.assertNotIn('class="katex-error"', dom)

    def test_search_and_study_sheet_render(self):
        self.assertIn('id="search-in"', self.dump(self.out, "#/search"))
        sheet = self.dump(self.out, "#/sheet")
        self.assertIn("sheet-unit", sheet)
        self.assertIn('class="katex"', sheet)

    def test_figure_renders(self):
        self.assertIn('<img src="data:image/svg+xml;base64,', self.dump(self.out, "#/u/u1/prestudy"))

    def test_final_review_and_notebook_render(self):
        self.assertIn("dark-card", self.dump(self.out, "#/review/midterm"))
        self.assertIn("<h1", self.dump(self.out, "#/notebook"))


class GraderTests(unittest.TestCase):
    """evals/grade_course.py: the mechanical checks used by the skill evals."""

    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(ROOT / "evals"))
        import grade_course  # noqa: E402
        cls.g = grade_course

    def failed(self, data):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "course.json"
            p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            return [c["text"] for c in self.g.grade(p, lang="zh-Hant")["checks"] if not c["passed"]]

    def test_flags_simplified_and_non_hk_terms(self):
        d = example_data()
        self.assertNotIn("zh-Hant text uses HK terms", self.failed(d))
        d["units"][0]["summary"] = "这个概率问题"
        failed = self.failed(d)
        self.assertIn("zh-Hant text has no Simplified characters", failed)
        self.assertIn("zh-Hant text uses HK terms", failed)

    def test_flags_short_quiz(self):
        d = example_data()
        d["units"][0]["prequiz"] = d["units"][0]["prequiz"][:2]
        self.assertIn("u1: prequiz has 6-10", self.failed(d))


class PluginTests(unittest.TestCase):
    """The repository is also a Claude Code plugin marketplace (.claude-plugin/)."""

    def test_manifests_point_at_the_skill(self):
        plugin = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
        market = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text(encoding="utf-8"))
        entry = market["plugins"][0]
        self.assertEqual(entry["name"], plugin["name"])
        self.assertEqual(entry["source"], "./")
        for path in plugin["skills"]:
            self.assertTrue(path.startswith("./") and ".." not in path, path)
            self.assertTrue((ROOT / path / "SKILL.md").is_file(), path)
        self.assertIn("name", market["owner"])


class PackageTests(unittest.TestCase):
    def test_package_contains_skill_files(self):
        sys.path.insert(0, str(ROOT / "tools"))
        import package_skill  # noqa: E402
        with tempfile.TemporaryDirectory() as d:
            out = package_skill.package(Path(d) / "scholia.skill")
            import zipfile
            names = zipfile.ZipFile(out).namelist()
        for must in ("scholia/SKILL.md", "scholia/scripts/build_scholia.py", "scholia/assets/app/app.js",
                     "scholia/assets/vendor/katex/katex.min.js"):
            self.assertIn(must, names)
        self.assertFalse(any("__pycache__" in n or n.endswith(".DS_Store") for n in names))


if __name__ == "__main__":
    unittest.main()
