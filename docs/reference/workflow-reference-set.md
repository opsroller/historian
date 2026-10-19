*Reference, for anyone looking up the `reference-set` workflow's arguments, phases and results.*

# reference-set

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/reference-set.js`](../../workflows/reference-set.js) |
| Invoke | `/historian:reference-set` |
| Skills used | visual-and-material-reference, source-criticism, citation-and-evidence, heritage-ethics, history-for-design, and latin-american-history when the subject is in Latin America or the Caribbean; engineering-practices project-onboarding, provenance, git-workflow |

Builds a sourced visual and material reference set, with an artist
brief, that artists and designers can work from.

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `subject` | yes | string | What the set is of |
| `for` | no | string | Who will use it; default: the art and design roles the profile names |
| `scope` | no | string | Period, place and people; default: what the subject and profile imply |
| `categories` | no | array | Any of `architecture`, `objects`, `dress`, `materials`, `colour`, `iconography`, `landscape`, `sound`; default: those the subject needs |
| `output` | no | string | Docs path; default: the profile's research or art-direction reference location |
| `branch` | no | string | Existing branch to work on |
| `pr` | no | string | Existing PR to work on |

Missing `subject`, or a `categories` list with no known category, returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Precise scope, categories, what artists most need per category, existing pages |
| Gather | 1 per category, in parallel | no | Items from holders' own records with identifier, date, place, kind of evidence, shows, limits, rights, sensitivity; essentials, avoid, gaps, search log. Downloads nothing |
| Vet | 1, independent | no | Opens every holder record: identity, kind of evidence, rights backed by the holder, claims no more than shown, sensitive items |
| Write | 1 | yes (branch) | Artist brief and per-category item tables; drops or corrects vetted problems; leaves sensitive items out unless permission is recorded; places only public-domain or openly licensed images, logged for provenance; commits |
| Check | 1-3, independent; one revision edits | no | Every field present, vet findings handled, brief tied to items, placed images licensed and logged, gaps explicit, Diataxis form |
| Hand off | 1 | no (pushes) | Pushes; updates or opens a draft `docs:` PR. Does not mark it ready or merge |

## Results

| Field | Meaning |
|---|---|
| `status` | `done`; `partial` (some categories returned nothing; see `emptyCategories` and `next`); `unverified`; `blocked` with `open` or `reason` |
| `subject`, `scope`, `categories`, `itemCount` | What the set covers |
| `placedImages` | Image files placed in the project, each openly licensed and logged; also in `handoff.non_original` |
| `sensitive`, `consultation` | Items left out as sensitive, and consultation the owner should arrange |
| `docs`, `undocumented`, `notes` | Pages touched, gaps, non-blocking notes |
| `handoff` | The engineering-practices hand-off object |
| `next` | Rerun hint for empty categories, then tell the users and land the PR |

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels: `plan`, `gather:<category>`, `vet`, `write`, `check`, `revise`, `check-again`, `handoff`.

Independent steps: `vet`, `check` and `check-again`. In inline mode send them to a reviewer who did not do the work and name them in `run.reviewers`, or the run lists them under `self_reviewed`.

Related: [How to build a reference set for artists](../how-to/how-to-build-a-reference-set-for-artists.md) · [visual-and-material-reference](skill-visual-and-material-reference.md) · [index](index.md)
