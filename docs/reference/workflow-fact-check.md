*Reference, for anyone looking up the `fact-check` workflow's arguments, phases and results.*

# fact-check

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/fact-check.js`](../../workflows/fact-check.js) |
| Invoke | `/historian:fact-check` |
| Skills used | history-for-design, historical-research, source-criticism, citation-and-evidence, visual-and-material-reference, heritage-ethics; engineering-practices project-onboarding, git-workflow |

Checks what a team made against history and writes the review, without
changing the work checked.

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `target` | yes | string | Files, a PR, a branch, or pasted text to check |
| `context` | no | string | Period, place, people and research pages to check against; default: what the profile and research pages name |
| `owner` | no | string | Role that owns the target and decides the fixes; default: the one the profile names |
| `output` | no | string | Docs path for the review; default: the profile's research location |
| `branch` | no | string | Existing branch for the review |
| `pr` | no | string | Existing PR for the review |

Missing `target` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Extract | 1 | no | Every historical claim, depiction and name, with where it is and its lens. A target with none returns `done` at once |
| Assess | 1 per lens used, in parallel | no | Lenses `history`, `material`, `language`, `representation`; a verdict per claim (supported, departure-recorded, error, anachronism, unsupported, representation), severity, evidence, fix |
| Confirm | 0-1, independent | no | Runs only when there are errors, anachronisms or representation findings: opens the evidence and checks verdict, severity and fix |
| Docs | 1 | yes (branch) | The review page (counts, decisions needed, every claim) and proposed departures for the owner; corrects or withdraws disputed findings; commits |
| Check | 1-3, independent; one revision edits | no | Every finding carried, disputes handled, departures written as proposals, target unchanged, Diataxis form |
| Hand off | 1 | no (pushes) | Pushes; updates or opens a draft `docs:` PR. Does not mark it ready or merge |

## Verdicts and severity

| Verdict | Meaning |
|---|---|
| `supported` | Matches the evidence |
| `departure-recorded` | Differs, and the departures record covers it |
| `error` | Contradicts the evidence |
| `anachronism` | Belongs to another time or place |
| `unsupported` | No evidence either way |
| `representation` | Fails a heritage-ethics check |

Severity: `high` misrepresents a living people or sacred practice, or is
wrong in what the product teaches; `medium` a visible error or
anachronism; `low` background detail; `none` supported or recorded.

## Results

| Field | Meaning |
|---|---|
| `status` | `done`; `partial` (a lens returned nothing; see `unassessedLenses` and `next`); `unverified`; `blocked` with `open` or `reason` |
| `target`, `scope` | What was checked |
| `counts`, `findings` | Counts by verdict; every finding, most severe first |
| `proposedDepartures` | Departures for the owner to accept or fix |
| `docs`, `undocumented`, `notes` | Pages touched, gaps, non-blocking notes |
| `handoff` | The engineering-practices hand-off object |
| `next` | Send the findings to the owner, then land the review |

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels: `extract`, `assess:<lens>`, `confirm`, `docs`, `check`, `revise`, `check-again`, `handoff`.

Independent steps: `confirm`, `check` and `check-again`. In inline mode send them to a reviewer who did not do the work and name them in `run.reviewers`, or the run lists them under `self_reviewed`.

Related: [How to fact-check a design or script](../how-to/how-to-fact-check-a-design-or-script.md) · [history-for-design](skill-history-for-design.md) · [index](index.md)
