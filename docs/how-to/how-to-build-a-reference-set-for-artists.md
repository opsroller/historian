*How-to guide, for someone using the plugin who needs sourced visual reference for artists or designers.*

# How to build a reference set for artists

This guide produces a reference set and artist brief with the
`reference-set` workflow.

## Run the workflow

```
/historian:reference-set
args: { subject: "stone temple architecture and its painted finish", for: "art direction and environment art", categories: ["architecture", "materials", "colour", "iconography"] }
```

- Leave out `categories` to let the plan step choose what the subject
  needs.
- Name the users in `for`; the brief's essentials and do and avoid lists
  are written for them.

## Read the result

- Every item names its holder and identifier, kind of evidence, what it
  shows and cannot show, and its rights. Items marked "reference only,
  not for reuse" are links, not files.
- `placedImages` lists the only image files added to the project: each
  is public domain or openly licensed on its holder's page and logged
  for provenance.
- `sensitive` lists items left out because a living community may hold
  them sacred, funerary or restricted. Do not add them back without the
  owner recording permission.

## Use it well

- Link the set from the art-direction or design docs, so artists find
  it where they already look.
- Remind the artists of the brief's rule: reference informs original
  work and is never traced, copied or photobashed into shipped art.
- When the art is made, check it with
  [the fact-check workflow](how-to-fact-check-a-design-or-script.md).

Related: [reference-set reference](../reference/workflow-reference-set.md) · [visual-and-material-reference](../reference/skill-visual-and-material-reference.md) · [About the role](../explanation/about-the-role.md)
