# Eval results

Evals 1–3 run on 2026-11-15 and evals 4–5 on 2026-11-16 against the skill in this repository, one run per eval. Each run was a fresh
Claude agent that read `scholia/SKILL.md` and the attached files, without being told the expected
answers.

| Eval | Mechanical checks (`grade_course.py`) | Manual expectations | Notes |
|---|---|---|---|
| 1 · single-week-zh-hant | 19/19 | all met | Both homework answers right; `hints-first` set because HW1 is ungraded; HK usage |
| 2 · wrong-answer-key | 18/19 | all met | Caught both key errors (P2 is 2.1 not 2.2; P3 is 0.49 not 2.7), re-derived with Python `fractions`. Failed check: only 26% of items cited a source (SKILL.md has since been tightened) |
| 3 · bilingual-content | 20/20 | all met | zh-Hant + en on every field, 0 missing translations; explained the doubled cost |
| 4 · two-units-and-midterm | 28/28 | 6 of 7 met | Midterm scope u1+u2, 18 exam questions, strategy and formula sheet from the past paper, 3 SVG figures, all past-paper answers right. Missed: Q1–Q6 of the mock exam copy the past paper verbatim (the other 12 are new) |
| 5 · add-unit-to-existing-course | 30/30 | all met | Used `--summary`, wrote only `units/u02.json` and a figure; `u01.json` byte-for-byte unchanged; reused the concept label 機會成本 |

All three built sites rendered in headless Chrome with no KaTeX errors.

Eval 2 also showed that the expected answers in `evals.json` were wrong at first: the fixture's key
has two errors, not the one we planted. Re-derive the expected answers whenever you add an eval.
