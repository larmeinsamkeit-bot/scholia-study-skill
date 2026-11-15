# Scholia

**Turn your course materials into an interactive study site — one Claude skill, one HTML file.**

*Scholia* (Greek: the notes scholars wrote in the margins of a text) is a [Claude](https://claude.ai)
skill. Give Claude your syllabus, slides, notes, homework and past exams; it reads them, builds a
course map and generates a single self-contained web page that walks you through the whole learning
loop for every unit:

| Before class | In class | After class | End of term |
|---|---|---|---|
| 1 · Pre-study materials<br>2 · Pre-study quiz<br>3 · Pre-study mistakes & difficulties | 4 · Classroom question log | 5 · After-class review (recap, flashcards, quiz)<br>6 · After-class mistakes & difficulties<br>7 · Homework solutions (hints first) | Midterm review<br>Final review (timed mock exam) |

Plus:

- **Mistake notebook with spaced re-tests** — wrong answers come back after 1, 3, 7 and 14 days until you get them right twice
- **Confidence ratings** — a right answer marked "guessing" still goes into the notebook
- **Source citations** on every section, question and difficulty
- **Classroom questions → Claude** — log questions in lecture, export them, paste them back to Claude for answers
- **Weak-spot tracking** that feeds the midterm and final reviews
- **繁體中文 / 简体中文 / English** interface; course content in the language(s) you choose
- Works offline in any browser, light and dark mode, phone-friendly; progress is saved in your browser

**Try it without installing anything:** download [`build/scholia-example.html`](build/scholia-example.html)
and open it in your browser — a small two-unit sample course.

## Install the skill

1. Download **`scholia.skill`** from the [latest release](../../releases/latest) (or from [`dist/`](dist/)).
2. Install it:
   - **Claude.ai / Claude desktop app:** open the file in a chat and click **Save skill**, or go to
     *Settings → Capabilities → Skills* and upload it.
   - **Claude Code:** unzip it into `~/.claude/skills/` so you get `~/.claude/skills/scholia/SKILL.md`.
3. Start a new chat, upload your course materials and say something like
   *"Use Scholia to build me a study site for this course."*

Claude will ask which language(s) to write the content in (each extra language roughly doubles the
work and tokens), then generate the site.

## Build a site yourself

The skill's `scripts/build_scholia.py` (Python 3, no dependencies) validates course data and compiles
it into one HTML file:

```bash
python3 scholia/scripts/build_scholia.py scholia/references/example-course -o my-course.html
```

Course data format: [`scholia/references/data-schema.md`](scholia/references/data-schema.md).
Content quality guide: [`scholia/references/content-guide.md`](scholia/references/content-guide.md).

## Repository layout

```
scholia/                 the skill (SKILL.md, app template, build script, references, example course)
dist/scholia.skill       the packaged skill, ready to install
build/scholia-example.html   the example course, built
design/                  the original Claude Design canvas (5 artboards) the app was built from
```

## A note on course materials

Generated study sites contain material derived from your instructors' slides, homework and exams.
Keep them for your own study; don't publish them without permission.

## License

[MIT](LICENSE)
