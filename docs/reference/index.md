*Reference landing page, for anyone looking up a part of the historian plugin.*

# Reference

These pages describe each part of the plugin as it is. They mirror the
repository: one page for the agent, one per skill, one per workflow.

## Agent

- [historian](agent.md): what the agent owns, what it asks before
  doing, what it leaves to neighbouring roles, and its "never" list.

## Skills

**Finding out**
- [historical-research](skill-historical-research.md): questions tied to decisions, depth, where to look, search log, when to stop.
- [source-criticism](skill-source-criticism.md): who made a source, when, why, how it reached us; bias, corroboration, grades.
- [citation-and-evidence](skill-citation-and-evidence.md): citations that can be followed, the claim ledger, quotation, never fabricating.

**Specialism**
- [latin-american-history](skill-latin-american-history.md): periods and peoples, source types, archives and digital editions, languages, names, debates.

**Research into design**
- [visual-and-material-reference](skill-visual-and-material-reference.md): reference sets for artists, item records, rights, reconstruction labels.
- [heritage-ethics](skill-heritage-ethics.md): stereotype and erasure checks, sacred material, names, consultation, credit.
- [history-for-design](skill-history-for-design.md): per-role direction, accuracy and authenticity, departures record, checking what was made.

## Workflows

| Workflow | Args | Page |
|---|---|---|
| `research-brief` | `{ question, for?, scope?, depth?, output?, branch?, pr? }` | [research-brief](workflow-research-brief.md) |
| `reference-set` | `{ subject, for?, scope?, categories?, output?, branch?, pr? }` | [reference-set](workflow-reference-set.md) |
| `fact-check` | `{ target, context?, owner?, output?, branch?, pr? }` | [fact-check](workflow-fact-check.md) |

## plugin.json fields

| Field | Value |
|---|---|
| `name` | `historian` |
| `version` | `0.1.0` |
| `author.name` | `opsroller` |
| `repository` | `https://github.com/opsroller/historian` |
| `license` | `GPL-2.0-or-later` |
| `keywords` | `role`, `job-function`, `historian`, `research`, `history`, `primary-sources`, `source-criticism`, `citation`, `fact-check`, `reference`, `material-culture`, `cultural-heritage`, `latin-america`, `mesoamerica`, `public-history` |

## Sources

The research behind the plugin is listed in [SOURCES.md](../../SOURCES.md).
