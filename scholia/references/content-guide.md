# Content guide — the quality bar for each stage

The site is only as good as what you write into it. These notes explain what each stage is for, so
you can make good calls on materials that don't fit neatly.

## General

- **Ground it in the course.** Use the instructor's notation, terminology, examples and ordering.
  A student who sees different symbols in Scholia than in lecture gets confused, not helped.
- **Cite.** Put a `source` on sections, questions and difficulties (`教科書 §3.2`, `Slides W5 p.14`).
  It lets the student go back to the original and check you.
- **Fill gaps, don't contradict.** Adding a clearer analogy, a missing derivation step, or a worked
  example is welcome. Overriding what the course says is not — if you think the materials are
  wrong, say so in a margin note and let the student ask the instructor.
- **Concepts are the glue.** The `concept` label on questions and difficulties is how the app finds
  weak spots and links a student's mistakes to your explanations. Pick a small vocabulary per unit
  (3–6 concepts) and reuse the exact same wording.
- **Language.** Write in `course.lang`. For 繁體中文 aimed at Hong Kong students, use HK usage
  (機率, 溫習, 功課, 軟件); keep standard English technical terms in brackets the first time they
  appear (e.g. 期望值 (expected value)) because lectures in HK are often in English.

## 1 · Pre-study materials (`prestudy`)

Purpose: get the student oriented in 20–30 minutes so the lecture makes sense first time.

- 2–4 objectives phrased as things they'll be able to *do*.
- 2–4 sections. A guided summary in plain language, not a copy of the textbook. Lead each section
  with the intuition, then the definition, then one small example.
- 3–8 key terms with one-line definitions.
- Margin `notes`: where to read (source), what earlier unit this builds on, one notation or
  concept to watch out for, one thing to listen for in class.

## 2 · Pre-study quiz (`prequiz`)

Purpose: check they read it and surface misconceptions *before* class.

- 6–10 questions, mostly difficulty 1–2. Mostly `single`, some `tf`, at most 1–2 `short`.
- Test recognition and simple application, not long calculation.
- **Distractors should be real mistakes** — the answer a student who holds a specific misconception
  would pick. Then `optionFeedback` names that misconception. Random wrong numbers teach nothing.
- `explanation`: why the right answer is right, then why the most tempting wrong one is wrong.

## 3 · Pre-study difficulties (`difficulties`)

Purpose: the app shows the student's own wrong answers here automatically; you supply the
difficulties you *predict* from the materials.

- 2–4 entries. Each is one specific stumbling block, not a topic ("confusing X with x", "thinking
  E[X] must be a possible value").
- `why`: why smart students fall into it. `explanation`: the fix. `example`: a tiny worked case.
- Give each a `concept` matching the quiz so the app can say "linked to your mistakes".

## 4 · Classroom (`classroom`)

- `listenFor`: 2–3 things to pay attention to in lecture — usually what the pre-study raised but
  couldn't settle.
- `answers`: filled in later, when the student brings exported questions back. Answer each as a
  patient tutor would, using the course materials, and cite.

## 5 · After-class review (`review` + `postquiz`)

Purpose: consolidate after the lecture.

- `recap`: the unit on one screen — the structure of ideas, not a transcript.
- `keyPoints`: 4–8 sentences the student should be able to say from memory.
- `flashcards`: 8–15 cards; one fact or idea per card; front is a question, not a heading.
  Use cloze cards (`{{c1::…}}`, see the schema) for definitions, formulas and fixed phrases —
  2–4 per unit; keep the rest as question/answer cards.
- `postquiz`: 6–10 questions, difficulty 2–3, testing *use*: calculations, choosing a method,
  interpreting a result. Past-exam style where you have past exams.

## 6 · After-class difficulties (`postDifficulties`)

Deeper than stage 3: errors that appear when students apply the idea (wrong method choice, sign
errors, misreading the question type). 2–4 entries, same shape as stage 3.

## 7 · Homework (`homework`)

- Copy the problem statement faithfully.
- `hints`: 1–3, each a nudge that doesn't give the next step away entirely.
- `steps`: a full worked solution in the course's method, one idea per step.
- `pitfalls`: the mistakes graders typically see.
- If the homework hasn't been graded yet, or the user wants to learn rather than copy, set
  `revealMode: "hints-first"`.
- If you're not sure of an answer (ambiguous problem, missing data), set `confidence: "low"` and
  say in the answer what is uncertain. Never present a guess as an official key.

## Midterm / final reviews

- `overview`: what's covered and how the units connect.
- `themes`: 3–5 cross-unit threads — the synthesis students can't easily do themselves.
- `formulaSheet`: what's worth memorising, in the course's notation.
- `strategy`: built from past exams when available (question types, mark weighting, time).
- Past exams set the *format and difficulty*, not the questions: rewrite past-paper questions with
  new numbers or contexts so the mock exam measures what the student can do, not what they remember.
- `exam`: 15–25 questions for a midterm, 25–40 for a final, mixed difficulty, spread across the
  scope in proportion to lecture time. Don't reuse quiz questions verbatim; reuse concepts.

## Checking your own work

Before building, run through this list for each unit:

- Every computed number re-derived with Python (or by hand for symbolic answers) — including the
  numbers in an official answer key, which can be wrong.
- Every section, question, difficulty and homework problem has a `source`.
- `answer` index points at the correct option; no other option is also defensible.
- `optionFeedback` lines up with the options (same order, `null` for the correct one).
- Money written as `\\$` so it isn't read as math (the build script warns otherwise).
- Every formula you took from slides matches the slide, not the flattened extracted text.
- Anything you are unsure about is marked `confidence: "low"` with the reason.
