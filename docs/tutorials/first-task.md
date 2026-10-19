*Tutorial, for someone using the historian plugin for the first time.*

# Your first research brief: answer one question for a designer

In this tutorial we will take one small question a designer might ask,
answer it with the `research-brief` workflow, read the brief it writes,
and see how its checks keep every claim honest. We will use the
`historian` agent and the skills it loads on its own.

Our question: **"What did people in a Nahua town eat on an ordinary day
around 1500?"** It is small on purpose, well documented, and in Latin
America, the plugin's first specialism.

## Before we start

You need:

- the plugin installed (see the [README](../../README.md)), with
  `engineering-practices`;
- a project in git with a `CLAUDE.md` and profile that say where
  research and docs live and which citation style to use;
- web access for the agent, so it can open catalogues, digital editions
  and scholarship.

## 1. Ask the agent what it would look for

Ask:

```
Use the historian agent. Before researching, tell me how you would scope
"What did people in a Nahua town eat on an ordinary day around 1500?"
```

You should see the question restated with the decision it might feed,
a precise scope (which people, which region, which decades, commoners
as well as nobles), and a few research questions with where each answer
is likely to be: painted books and early colonial accounts, archaeology
of households, and recent scholarship. Notice that it plans to read the
community's own sources beside colonial ones.

## 2. Run the workflow

```
/historian:research-brief
args: { question: "What did people in a Nahua town eat on an ordinary day around 1500?", for: "a designer writing a market and kitchen scene", depth: "quick" }
```

We use `depth: "quick"` so the run is short. Watch the phases go by:
Scope, then one Research step per question in parallel, then Sources.

## 3. See the independent source check

The Sources step is done by a reviewer that did no research. It opens
every cited source at the page or record cited. If you see problems
listed, look at what happens next: the Write step must drop or regrade
each affected claim, and the Check step confirms it did.

## 4. Read the brief

Open the page the result lists under `docs`. You should find:

- the answer first, with a confidence grade;
- what it means for the designer, as must, opportunities, free to
  invent and avoid;
- the claim ledger, one row per claim with its grade and sources;
- source notes saying who made each main source, when and why;
- the search log, including searches that found nothing.

Pick one claim and follow its citation to the source. It should take
you to the exact place.

## 5. Land it

The result's `next` gives the land-pr command for the draft PR. Run it
when the PR's checks are green.

## What we did

We turned a question into scoped research questions, researched them
from sources, had the citations checked by someone who did not do the
research, and wrote a brief a designer can act on, with every claim
traced. Next, try [building a reference set for
artists](../how-to/how-to-build-a-reference-set-for-artists.md), or read
[about the role](../explanation/about-the-role.md) to see why it works
this way.
