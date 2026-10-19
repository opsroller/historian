*How-to guide, for someone using the plugin who needs a design, script, asset, scene or page checked against history.*

# How to fact-check a design or script

This guide checks finished or draft work with the `fact-check`
workflow. It writes a review; it never changes the work itself.

## Run the workflow

```
/historian:fact-check
args: { target: "the pull request that adds the market scene's dialogue and props", owner: "game-designer", context: "the market research brief" }
```

- `target` can be files, a PR, a branch or pasted text.
- Name the `owner`: the role that decides the fixes. The historian
  proposes; the owner decides.

## Read the result

- `findings` are sorted most severe first. `high` means a living people
  or sacred practice is misrepresented, or something the product
  teaches is wrong: fix those before the work ships.
- Each finding has evidence with citations and a fix that keeps the
  work's intent.
- `proposedDepartures` are inventions that are fine but unrecorded.
  The owner accepts each one into the departures record or changes the
  work.

## Hand it on

Send the findings and proposed departures to the owner, then land the
review's draft PR with `/engineering-practices:land-pr`.

Related: [fact-check reference](../reference/workflow-fact-check.md) · [history-for-design](../reference/skill-history-for-design.md) · [heritage-ethics](../reference/skill-heritage-ethics.md)
