*Reference, for anyone looking up the `research-brief` workflow's arguments, phases and results.*

# research-brief

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/research-brief.js`](../../workflows/research-brief.js) |
| Invoke | `/historian:research-brief` |
| Skills used | historical-research, source-criticism, citation-and-evidence, history-for-design, heritage-ethics, and latin-american-history when the subject is in Latin America or the Caribbean; engineering-practices project-onboarding, git-workflow |

Answers one historical question for the people who will build on it,
as a sourced, checked brief in the project's research docs.

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `question` | yes | string | What the team needs to know |
| `for` | no | string | Who will use it and the decision it feeds; default: the roles the profile names |
| `scope` | no | string | Period, place and people; default: what the question and profile imply |
| `depth` | no | `"quick"`, `"brief"` or `"study"` | How far to go; default `"brief"` |
| `output` | no | string | Docs path for the brief; default: the profile's research location |
| `branch` | no | string | Existing branch to work on |
| `pr` | no | string | Existing PR to work on |

Missing `question` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Scope | 1 | no | Need and decision, precise scope, up to six research questions with where to look, existing pages to reuse |
| Research | 1 per question, in parallel | no | Searches, judges and cites sources; grades claims; search log; heritage notes |
| Sources | 1, independent | no | Opens every cited source at the place cited; checks it exists, says what is claimed, and supports the grade |
| Write | 1 | yes (branch) | The brief: answer and confidence, per-role meaning, must / opportunities / free to invent / avoid, claim ledger, debates, source notes, bibliography, search log; glossary and timeline entries; commits |
| Check | 1-3, independent; one revision edits | no | Claims match the verified research, source problems handled, heritage checks, Diataxis form, citations followable |
| Hand off | 1 | no (pushes) | Pushes; updates or opens a draft `docs:` PR. Does not mark it ready or merge |

## Results

| Field | Meaning |
|---|---|
| `status` | `done`; `partial` (some questions returned nothing; see `unanswered` and `next`); `unverified` (a check returned nothing); `blocked` with `open` or `reason` |
| `question`, `answer`, `scope` | The question and the brief's headline answer with its confidence |
| `questions`, `unanswered` | Each research question's answer; ids of those that returned nothing |
| `consultation` | Consultation or permission the owner should arrange |
| `docs`, `undocumented`, `notes` | Pages touched, gaps, non-blocking notes |
| `handoff` | The engineering-practices hand-off object |
| `next` | Rerun hint for unanswered questions, then tell the roles and land the PR |

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels: `scope`, `research:<question id>`, `sources`, `write`, `check`, `revise`, `check-again`, `handoff`.

Independent steps: `sources`, `check` and `check-again`. In inline mode send them to a reviewer who did not do the work and name them in `run.reviewers`, or the run lists them under `self_reviewed`.

Related: [How to answer a historical question](../how-to/how-to-answer-a-historical-question.md) · [historical-research](skill-historical-research.md) · [index](index.md)
