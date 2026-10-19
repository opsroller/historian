*How-to guide, for someone using the plugin who needs a historical question answered for a decision.*

# How to answer a historical question

This guide takes a team's question to a sourced, checked brief in the
project's research docs, using the `research-brief` workflow.

## Run the workflow

```
/historian:research-brief
args: { question: "What did a market in a large Nahua city sell around 1500, and how was it laid out?", for: "environment art and level design: the market scene", depth: "brief" }
```

- Put the decision in `for`. The brief tells each role what the answer
  means for them, so name the roles.
- Pick the least `depth` the decision needs: `quick` for a yes or no
  that unblocks someone today, `brief` for most work, `study` when the
  product teaches the subject or builds a whole level on it.
- Give `scope` when the question could mean several periods or places.

## Read the result

- `answer` is the headline with its confidence. Check it before
  telling anyone.
- `status: "partial"` means some questions returned nothing; `next`
  gives the `run.only` rerun.
- `consultation` lists what the owner should arrange with a community
  before the work depends on it. Raise it now, not after it ships.

## Hand it on

Tell the roles that asked, linking the brief, then land the draft PR
with `/engineering-practices:land-pr`.

## If the answer is "unknown"

The brief says what was searched and what would settle it, and offers a
defensible option: the most likely answer by analogy, named as such, or
an invention. If the team invents, record it as a departure (see
[how to record a deliberate departure](how-to-record-a-deliberate-departure.md)).

Related: [research-brief reference](../reference/workflow-research-brief.md) · [historical-research](../reference/skill-historical-research.md) · [About the role](../explanation/about-the-role.md)
