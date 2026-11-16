---
name: scholia
description: Scholia turns a student's course materials (syllabus, textbook chapters, lecture slides, notes, homework sheets, past exams — PDF, Word, PowerPoint, images or text) into a single self-contained interactive study website that walks them through the full learning loop - pre-study materials, pre-study quiz, pre-study mistakes & difficulties, classroom question log, after-class review, after-class mistakes & difficulties, homework solutions, midterm review and final review. Use this skill whenever a user uploads course or class materials and wants to study, prepare for lectures, preview or review a course, get homework explained, build a study plan, make quizzes or flashcards from their notes, or prepare for midterms/finals — even if they never say "Scholia". Also use it when the user brings back exported Scholia questions or progress, or adds new materials to an existing Scholia course. 预习、课堂、复习、错题、作业、期中、期末复习 等学习流程请求同样使用本技能。
---

# Scholia

Scholia (from the Greek for "margin notes a scholar writes beside a text") turns a pile of course
materials into one interactive study site. The student uploads everything once; you read it, build a
course map, generate the content for each learning stage, and compile it into a single HTML file that
runs offline in any browser and remembers their progress.

## The learning loop

Each **unit** (a chapter, week or lecture — whatever the syllabus uses) goes through seven stages, and
the term ends with two review stages:

| # | Stage | Key in data | What the student does there |
|---|-------|-------------|-----------------------------|
| 1 | Pre-study materials | `prestudy` | Reads objectives, a guided summary, key terms |
| 2 | Pre-study quiz | `prequiz` | Answers questions with instant feedback and a confidence rating |
| 3 | Pre-study mistakes & difficulties | `difficulties` | Sees their own wrong answers explained, plus the hard spots you anticipated |
| 4 | Classroom questions | `classroom` | Logs questions during lecture; exports them to bring back to you |
| 5 | After-class review | `review` + `postquiz` | Recap, flashcards, a review quiz |
| 6 | After-class mistakes & difficulties | `postDifficulties` | Their review-quiz mistakes explained, plus deeper difficulties |
| 7 | Homework solutions | `homework` | Hints first, then step-by-step solutions, then pitfalls |
| M | Midterm review | `midterm` | Cross-unit synthesis + timed mock exam |
| F | Final review | `final` | Whole-course synthesis + timed mock exam |

The app also has a cross-course **Mistake Notebook** (every wrong or low-confidence answer, with
spaced-repetition re-tests) and a **progress dashboard**. Those are computed by the app; you don't
generate data for them.

## Workflow

### 1. Inventory the materials

Read every file the user provided. Use the `pdf`, `docx` and `pptx` skills to extract text when those
formats appear, and look at images directly (photos of handwritten notes or whiteboards are common).

Text extraction loses things that matter, so check before you rely on it:
- **Equations in slides** are often stored as Office Math. Plain text extraction drops superscripts and
  brackets (`R(q)=70q−q^2` comes out as `Rq=70q−q2`). Rebuild them from the slide structure, or look at
  the rendered slide, before quoting a formula.
- **Scanned PDFs and photos** have no text layer. Read the page images yourself, transcribe
  equations carefully, and mark anything you could not read as `[illegible]` rather than guessing.
- **Answer keys can be wrong.** Instructor-posted solutions sometimes have typos or mismatched numbers.
  When the key disagrees with your own working, show the correct working, note the discrepancy in
  `pitfalls`, and set `confidence: "low"` if the question itself is ambiguous.
Sort each file into a role: syllabus/schedule, textbook/reading, slides, notes, homework/problem sets,
past exams, answer keys. Keep a short list mapping each file to a short source label (e.g.
`Slides W3`, `Textbook ch.4 p.88`) — you'll cite these in the content, which lets the student go back
to the original and lets them trust what they're reading.

**Content language — a setting the user chooses.** The site's interface (buttons, stage names,
feedback) always switches between 繁體中文, 简体中文 and English for free; that text is built into the
app. The course *content* (summaries, questions, explanations, solutions) is only shown in the
languages you actually write. So before generating, ask the user which content language(s) they want,
because every extra language roughly doubles the writing work, the time and the tokens it costs them.
Offer it as a short choice, with the most likely option first:

- one language — the language they talk to you in, or the one their preferences set (cheapest)
- two languages — for example 繁體中文 + English when the course is taught in English and the student
  wants to study in Chinese but answer exams in English
- all three — only if they ask; Simplified must be written as Simplified (different vocabulary, e.g.
  复习 / 作业), not machine-converted from Traditional

Record the answer in `course.contentLangs` (first entry = `course.lang`) and write every text field as
an object with those language keys (see `references/data-schema.md`, "Bilingual text"). When the user
later asks to add a language, keep the existing text and add the new key to each field; ids stay the
same, so their saved progress is kept. The build script counts any field still missing a language,
and the site shows a notice when the student switches to a language the content doesn't have.

Use `zh-Hant` with Hong Kong/Taiwan usage for Traditional, `zh-Hans` for Simplified, `en` for English;
never mix Traditional and Simplified characters within one language. Reply to the user in their own
language and script.

Ask the user only what you can't infer and that genuinely changes the output — usually at most:
- the content language(s), as above (skip if they already said),
- which units the midterm covers (default: syllabus says so, else the first half),
- whether any homework they uploaded is still being graded and they'd prefer hints only (see
  "Academic integrity" below).

### 2. Build the course map

Split the course into ordered units following the syllabus. With no syllabus, use chapter or lecture
boundaries. Give each unit a stable `id` (`u1`, `u2`, …). Stable ids matter: the app keys the
student's saved progress on them, so when you later add materials, reuse existing ids and append new
ones instead of renumbering.

### 3. Generate the content

Read `references/content-guide.md` before writing content — it has the quality bar for each stage
(how many questions, how to write distractors, what a good "difficulty" explanation looks like, how
to handle homework). The short version:

- **Ground everything in the materials.** Use the course's own notation, terminology and examples.
  Give every prestudy section, quiz question, difficulty and homework problem a `source` field —
  even with a single source file, name the part (`HW3 Q2`, `Notes §2`, `Slides W5 p.14`); for
  content you wrote yourself, cite what it is based on. Where you add something the materials don't contain (a clearer
  analogy, a missing derivation step), that's welcome, but don't contradict the course.
- **Pre-study is a preview, review is consolidation.** Pre-study questions test whether the student
  read and can recognise the ideas; post-class questions test whether they can *use* them.
- **Difficulties are predictions.** Stage 3 and 6 pair the student's actual mistakes (computed by the
  app) with the misconceptions you expect. Write those as you would explain them to a confused
  student in office hours, with a worked micro-example.
- **Every question has an explanation** that says why the right answer is right *and* why the
  tempting wrong answer is wrong. This is what makes the mistake notebook useful.
- **Verify every number.** For each question or homework step that involves a calculation, recompute
  it with a short Python check (plain arithmetic, or `fractions` for exact values) before writing it
  into the data. Check that the marked answer index really is the correct option and that no
  distractor is accidentally also correct. A wrong key teaches the wrong thing and erodes trust in
  the whole site.

For a large course, write one JSON file per unit rather than one huge file (see step 4); generating
unit by unit also keeps quality even across the course.

**Figures.** Many subjects are taught through diagrams (supply and demand, cost curves, circuits,
tree diagrams). Where a picture carries the idea, include it: any text field accepts
`![caption](figures/name.png)`, with the path relative to the course folder, and the build script
embeds the file so the site stays a single offline file. Ways to get one:
- **Slides (.pptx):** the images are in the zip under `ppt/media/`; pick the one the slide uses.
- **PDF pages:** render the page (`pdftoppm -r 150 -png`, or PyMuPDF `page.get_pixmap(dpi=150)`) and
  crop to the diagram.
- **Simple diagrams you can redraw** (a curve, a tree, a timeline): write a small SVG by hand. Use dark
  strokes on a transparent background; the app shows figures on a white card in both themes.

Keep each image under about 300 KB (PNG for diagrams, JPEG for photos), and write the caption so the
figure still makes sense to someone using a screen reader.

### 4. Write the data and build

The data format is in `references/data-schema.md`; `references/example-course/` is a small complete
example to copy from. Either form works as input to the build script:

- a single `course.json`, or
- a folder containing `course.json` (course info only), `units/u1.json`, `units/u2.json`, …,
  and optionally `midterm.json` and `final.json`.

Build:

```bash
python3 <skill-dir>/scripts/build_scholia.py <data.json or data-folder> -o <output>/scholia-<course-slug>.html
```

The script validates the data (missing fields, answer indices out of range, duplicate ids, midterm
scope pointing at unknown units) and prints every problem. Fix them and rebuild until it reports no
errors; warnings are worth reading too. Run with `--check` to validate without writing.

### 5. Check and deliver

If a browser tool is available, open the HTML and click through one unit and a mock exam to check
that math renders and quizzes grade correctly. Then give the user the file and a short how-to:

1. Open the file in any browser — it works offline, progress saves in that browser.
2. Before class: Stage 1 → 2 → 3. During class: Stage 4. After class: 5 → 6 → 7.
3. Use **Export** in the Classroom stage (or the top bar) and paste the result back to you to get
   their classroom questions answered.

Mention that saved progress lives in that one browser; the **Export progress** button lets them back
it up, move it to another device with a progress code, or add lecture, exam and re-test dates to their
calendar. The site reminds them to download a backup every week, because Safari may clear data for
sites that haven't been opened for a while. **Search** finds any concept across the course, and
**Study sheet** collects every unit's key points and formulas into one printable page.

## Follow-up conversations

**Classroom questions brought back.** The user pastes an exported block (it starts with
`SCHOLIA-QUESTIONS`). Answer each question carefully using the course materials, then add the answers
to that unit's `classroom.answers` list (`{ "q": …, "a": …, "source": … }`), rebuild, and send the new
file. Progress survives because the course title and ids are unchanged.

**Progress brought back** (`SCHOLIA-PROGRESS` block, or the exported JSON). Look at which concepts the
student keeps missing, explain those directly, and consider adding targeted `postDifficulties` or extra
`postquiz` questions for those concepts before rebuilding.

**New materials (adding units later).** Don't regenerate the course — write only what is new, so
it costs a fraction of the tokens and the student's progress is untouched:
1. Run `build_scholia.py <course-folder> --summary`. It prints every unit's id, date, title,
   question-id pattern and concept labels without you re-reading every file.
2. Write each new unit as its own `units/uNN.json` (next free id; the file name sets the order).
   Reuse the exact concept labels from the summary wherever the new unit builds on an old idea, so
   weak-spot tracking links them.
3. If the new units fall inside a review, append their ids to `midterm.scope` / `final.scope` and add
   a few exam questions for them; leave the existing questions alone.
4. Rebuild and send the new file. Ids and the course title are unchanged, so the student's saved
   progress carries over.

## Academic integrity

Homework solutions are for learning. If the user says the homework is currently being graded, or the
materials show it isn't due yet and the user wants to learn rather than just submit, set
`"revealMode": "hints-first"` on those problems — the app then makes the student work through every
hint before the full solution unlocks. Never present answers you're unsure of as an official key:
mark them with `"confidence": "low"` and say what you're unsure about, so the student checks with the
instructor.

## Resources

- `references/content-guide.md` — the quality bar for each stage. Read before generating.
- `references/data-schema.md` — every field, with types and required/optional.
- `references/example-course/` — a small two-unit course in folder form.
- `scripts/build_scholia.py` — validates data and compiles the HTML.
- `assets/app/` — the app itself (`index.html`, `styles.css`, `i18n.js`, `app.js`), inlined with
  KaTeX from `assets/vendor/` at build time. You don't normally edit it; all content goes in the data.
