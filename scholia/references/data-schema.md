# Scholia data schema

## Text fields

Every text field accepts light Markdown: `**bold**`, `*italic*`, `` `code` ``, `- ` bullet lists,
`1. ` numbered lists, blank-line paragraphs, and LaTeX math in `$...$` (inline) or `$$...$$`
(display). In JSON, backslashes must be doubled: write `"$\\frac{a}{b}$"`.

**Images:** `![caption](figures/supply-demand.png)` anywhere in a text field (usually a prestudy
section body, a recap, a difficulty example or a question stem). The path is relative to the course
folder (or to `course.json`'s folder). Allowed types: PNG, JPEG, GIF, WebP, SVG. The build script
embeds each file as a data URI so the site stays one offline file; it errors on a missing file and
warns above 600 KB. The caption doubles as the image's alt text.

**Money amounts must escape the dollar sign**: write `"\\$30,000"` (JSON) so it shows as $30,000.
An unescaped `$` starts a formula, and two prices in one string ("from $100 to $80") would be read
as one formula. `HK$`, `US$` and other letter-prefixed amounts are safest escaped too
(`HK\\$15`). The build script warns about likely unescaped money amounts.

### Bilingual text

Any text field may instead be an object keyed by language code:

```json
"title": { "zh-Hant": "條件機率", "en": "Conditional probability" }
```

The app shows the entry for the language the student picked in the top-bar switch, falling back to
`course.lang`, then to whichever entry exists. Use objects whenever `course.contentLangs` lists more
than one language, and give every text field every listed language — the build script warns with a
count of fields that miss one. With a single content language, plain strings are simpler.

Language codes: `zh-Hant` (繁體中文), `zh-Hans` (简体中文), `en` (English). Never mix Traditional and
Simplified characters inside one language's text.

`?` marks an optional field below.

## Course (`course.json`)

```jsonc
{
  "course": {
    "title": "機率與統計 I",                   // also the key for saved progress — keep it stable
    "subtitle?": "STAT 201 · 2026 秋季學期",
    "lang": "zh-Hant",                          // default content + UI language
    "contentLangs?": ["zh-Hant", "en"],         // languages the content is written in (default: [lang]);
                                                //   first entry must equal lang
    "instructor?": "李教授"
  },
  "units": [ /* Unit objects — or omit when using the folder form */ ],
  "midterm?": { /* Review object */ },
  "final?":   { /* Review object */ }
}
```

Folder form: `course.json` holds `course` (and optionally `midterm`/`final`); each `units/*.json`
holds one Unit object; `midterm.json` / `final.json` may also be separate files. Units are ordered by
filename — name them `u01.json`, `u02.json`, … so they sort past nine.

## Unit

```jsonc
{
  "id": "u1",                       // stable, unique; progress is keyed on it
  "title": "…",
  "summary?": "One or two sentences for the dashboard.",
  "date?": "2026-09-08",            // lecture date (ISO); shown on the card

  "prestudy": {
    "minutes?": 25,                 // estimated reading time
    "objectives": ["…"],
    "sections": [ { "heading": "…", "body": "markdown", "source?": "教科書 §1.2" } ],
    "keyTerms?": [ { "term": "…", "definition": "…" } ],
    "notes?": [ { "kind": "source|builds-on|watch|listen", "text": "markdown" } ]   // margin notes
  },

  "prequiz": [ /* Question */ ],
  "difficulties": [ /* Difficulty */ ],          // anticipated pre-study difficulties

  "classroom?": {
    "listenFor?": ["…"],
    "answers?": [ { "q": "student question", "a": "markdown answer", "source?": "…" } ]
  },

  "review": {
    "recap": "markdown",
    "keyPoints": ["…"],
    "flashcards": [ { "front": "…", "back": "…" } ],   // or a cloze card: { "front": "… {{c1::answer}} …", "back?": "extra" }
    "connections?": "markdown — links to earlier/later units"
  },

  "postquiz": [ /* Question */ ],
  "postDifficulties": [ /* Difficulty */ ],
  "homework?": [ /* Homework */ ]
}
```

## Question

```jsonc
{
  "id": "u1-pre-1",                 // unique across the whole course (exam questions too)
  "type": "single",                 // "single" | "multi" | "tf" | "short"
  "stem": "markdown",
  "options?": ["…", "…"],           // required for single / multi (2–6 options)
  "answer": 1,                      // single: index · multi: [indices] · tf: true|false · short: model answer
  "explanation": "markdown — why the answer is right AND why the tempting wrong one is wrong",
  "optionFeedback?": ["why A is tempting but wrong", null, "…"],   // same length as options
  "concept": "期望值",              // groups mistakes into weak spots; reuse exact wording
  "difficulty?": 2,                 // 1 easy · 2 medium · 3 hard
  "source?": "投影片 W5 p.14"
}
```

Short-answer questions are self-graded: the student writes, sees the model answer, then marks
themselves. Make the model answer list the key points a correct answer must contain.

## Difficulty

```jsonc
{
  "title": "把 P(A|B) 與 P(B|A) 混淆",
  "concept?": "條件機率",           // links it to the student's mistakes with the same concept
  "why?": "markdown — why students get this wrong",
  "explanation": "markdown — the fix",
  "example?": "markdown — a worked micro-example",
  "source?": "…"
}
```

## Homework

```jsonc
{
  "id": "hw1-3",
  "title": "第 1.3 題",
  "problem": "markdown — verbatim from the sheet when provided",
  "hints": ["first nudge", "bigger nudge"],
  "steps": ["markdown step 1", "…"],
  "answer": "markdown — final answer",
  "pitfalls?": ["…"],
  "concept?": "…",
  "source?": "功課 1",
  "revealMode?": "free",            // "free" | "hints-first" (solution unlocks after every hint)
  "confidence?": "high"             // "low" shows a "check with your instructor" badge
}
```

## Review (midterm / final)

```jsonc
{
  "title?": "期中溫習",
  "date?": "2026-10-20",
  "scope": ["u1", "u2"],            // unit ids covered
  "overview": "markdown",
  "themes": [ { "title": "…", "body": "markdown", "units?": ["u1", "u3"] } ],
  "formulaSheet?": "markdown",
  "strategy?": "markdown",
  "exam": [ /* Question */ ],
  "timeLimitMin?": 60
}
```

The app adds readiness-by-unit and weak-spot panels automatically from the student's answers.

## Cloze flashcards

A flashcard whose `front` contains `{{c1::…}}` is a cloze (fill-in-the-blank) card. The app shows
the sentence with each deletion replaced by `［……］`, or by a hint written as `{{c1::answer::hint}}`;
flipping reveals the full sentence with the answers in bold. `back` becomes optional extra text.
Use `c1`, `c2`, … for separate blanks; the Anki export keeps the numbers, so Anki makes one card per
number. Math can sit inside a deletion: `{{c1::$\\dfrac{a}{b}$}}`.
