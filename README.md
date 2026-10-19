# Historian

A role plugin for a historian and researcher on a product team. The
historian finds out what can be known about the past a product draws
on, says how well it is known, and hands it to the people who make the
product in a form they can build from: sourced research briefs, visual
and material reference sets for artists, and fact checks of what the
team made. It keeps evidence, interpretation and invention apart, and
treats living communities' heritage with care, credit and consent.

Its first specialism is Latin American history, from the Indigenous
civilizations before contact through the colonial era and independence
to the modern nations. The method works for any period or region.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install historian@opsroller
```

It builds on `engineering-practices`; install that too. The agent needs
web access to reach catalogues, digital editions and scholarship.

## Documentation

**Start here.** [Your first research brief](docs/tutorials/first-task.md)
walks through one question from scope to a checked brief.

**Doing the job.** Task guides:
[answer a historical question](docs/how-to/how-to-answer-a-historical-question.md),
[build a reference set for artists](docs/how-to/how-to-build-a-reference-set-for-artists.md),
[fact-check a design or script](docs/how-to/how-to-fact-check-a-design-or-script.md) and
[record a deliberate departure](docs/how-to/how-to-record-a-deliberate-departure.md).

**Looking things up.** The [reference](docs/reference/index.md) describes
the agent, the seven skills and the three workflows (`research-brief`,
`reference-set`, `fact-check`) with their arguments and outputs;
[SOURCES.md](SOURCES.md) lists the research behind them.

**Wondering why?** [About the historian role](docs/explanation/about-the-role.md)
explains the reasoning (research drives design, evidence apart from
invention, independent checks, Latin America first, heritage ethics)
and the boundaries with neighbouring roles.

## License

Copyright (C) 2026 the contributors. Licensed under the GNU General Public License v2.0 or later (`GPL-2.0-or-later`); see `LICENSE`.
