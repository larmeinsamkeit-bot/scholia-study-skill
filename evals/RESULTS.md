# Eval results

Run on 2026-11-15 against the skill in this repository, one run per eval. Each run was a fresh
Claude agent that read `scholia/SKILL.md` and the attached files, without being told the expected
answers.

| Eval | Mechanical checks (`grade_course.py`) | Manual expectations | Notes |
|---|---|---|---|
| 1 · single-week-zh-hant | 19/19 | all met | Both homework answers right; `hints-first` set because HW1 is ungraded; HK usage |
| 2 · wrong-answer-key | 18/19 | all met | Caught both key errors (P2 is 2.1 not 2.2; P3 is 0.49 not 2.7), re-derived with Python `fractions`. Failed check: only 26% of items cited a source (SKILL.md has since been tightened) |
| 3 · bilingual-content | 20/20 | all met | zh-Hant + en on every field, 0 missing translations; explained the doubled cost |

All three built sites rendered in headless Chrome with no KaTeX errors.

Eval 2 also showed that the expected answers in `evals.json` were wrong at first: the fixture's key
has two errors, not the one we planted. Re-derive the expected answers whenever you add an eval.
