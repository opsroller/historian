// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'reference-set',
  description: 'Build a sourced visual and material reference set that artists and designers can work from: fix the subject\'s period, place and people and the categories it needs (architecture, objects, dress and adornment, materials and techniques, colour, iconography and ornament, landscape, sound), gather items for each category in parallel from holders\' own records with identifier, date, place, kind of evidence, what it shows and does not show, and rights status, have every item checked in an independent read-only pass for provenance, rights, labelling of reconstructions and heritage sensitivity, write the set and its artist brief (essentials, do and avoid, how to use reference without copying) into the project\'s docs, check the pages independently with one revision, and push them as a draft docs PR. args: { subject: "<what the set is of>", for?: "<who will use it, e.g. art direction, environment art, UI>", scope?: "<period, place, people>", categories?: ["architecture", "objects", "dress", "materials", "colour", "iconography", "landscape", "sound"] (default: those the subject needs), output?: "<docs path>", branch?: "<existing branch>", pr?: "<existing PR>" }',
  phases: [
    { title: 'Plan', detail: 'scope and categories, read-only' },
    { title: 'Gather', detail: 'one researcher per category, in parallel, read-only' },
    { title: 'Vet', detail: 'independent read-only check of every item' },
    { title: 'Write', detail: 'the reference set and the artist brief, on a branch' },
    { title: 'Check', detail: 'independent read-only check of the pages, one revision' },
    { title: 'Hand off', detail: 'push and open or update the draft PR' },
  ],
}

// --- run-modes v2 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const reviewers = c.reviewers && typeof c.reviewers === 'object' ? c.reviewers : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  // An answer must carry every required key of its schema, as the runtime
  // enforces for agents; returns the missing keys, or null when it fits.
  const missing = (v, schema) => {
    if (v === null || v === undefined) return 'an answer'
    if (!schema || schema.type !== 'object') return null
    if (typeof v !== 'object' || Array.isArray(v)) return 'a JSON object'
    const gap = (schema.required || []).filter((k) => !has(v, k) || v[k] === undefined)
    return gap.length ? gap.join(', ') : null
  }
  const seen = {}
  const out = {}
  // Who answered each step marked independent: "subagent" when this run
  // spawned it, else the reviewer named in run.reviewers, else "self".
  const by = {}
  const who = (k) => (typeof reviewers[k] === 'string' && reviewers[k].trim() ? reviewers[k].trim() : 'self')
  const skipped = []
  const next = []
  const logs = []
  let current = ''
  let reached = !from
  let halting = false
  let release = () => {}
  const halted = new Promise((r) => { release = r })
  const picked = (ph, label) => reached && (!only || only.some((s) => s === ph || s === label || label.startsWith(s + ':')))
  const agent = (prompt, opts) => {
    const op = opts || {}
    const independent = op.independent === true
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; if (independent) by[key] = who(key); return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      const pass = Object.assign({}, op)
      delete pass.independent
      return realAgent(prompt, opts ? pass : opts).then((r) => {
        if (r !== null && r !== undefined) { out[key] = r; if (independent) by[key] = 'subagent' }
        return r
      })
    }
    const brief = { key, phase: ph, prompt, schema: op.schema || null }
    if (independent) brief.independent = true
    if (note) brief.note = note
    next.push(brief)
    if (!halting) {
      halting = true
      // Wait 200 microtask turns before pausing, so every sibling in a
      // parallel() or pipeline() fan-out queues its brief into this pause.
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    const self_reviewed = Object.keys(by).filter((k) => by[k] === 'self')
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, reviewers: by, self_reviewed, skipped, logs,
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done". To avoid pasting results back on every call, drive the run with engineering-practices tools/run-inline.mjs and a state file instead: it stores each answer and prints only the next briefs.',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: reference-set { subject: "<what the set is of>", for: "<who will use it, optional>", scope: "<period, place, people, optional>", categories: ["architecture"|"objects"|"dress"|"materials"|"colour"|"iconography"|"landscape"|"sound", ...] (optional), output: "<docs path, optional>", branch: "<existing branch, optional>", pr: "<existing PR, optional>" }'
if (!args || !args.subject) return USAGE
const CATEGORIES = {
  architecture: 'architecture and space: buildings, plans, construction, interiors, urban layout',
  objects: 'objects: tools, vessels, furniture, weapons, ritual and everyday things',
  dress: 'dress, adornment and bodies: clothing, textiles, jewellery, hair, insignia of rank',
  materials: 'materials and techniques: stone, wood, metal, feathers, ceramics, textiles, how they were made, worked and finished',
  colour: 'colour and pigment: surviving pigment, analysis, fading, restoration and repainting',
  iconography: 'iconography, writing and ornament: motifs, glyphs, symbols, what they meant and who could use them',
  landscape: 'landscape, plants and animals: terrain, water, vegetation, fauna, the built landscape',
  sound: 'sound and music: instruments, performance, soundscape, with reconstructions labelled',
}
const subject = String(args.subject)
const audience = args.for ? String(args.for) : 'the art and design roles the project profile names'
const scope = args.scope ? String(args.scope) : 'the period, place and people the subject and the project profile imply; state them precisely'
const asked = Array.isArray(args.categories) ? args.categories.map(String).filter((c) => CATEGORIES[c]) : null
if (Array.isArray(args.categories) && !asked.length) return USAGE
const output = args.output ? String(args.output) : 'the research or art-direction reference location the project profile names, as a new reference page titled for the subject'
const where = args.pr
  ? `Work on the existing PR ${args.pr} and its head branch; do not create a new branch or PR.`
  : args.branch
    ? `Work on the existing branch ${args.branch} (reuse its open PR if one exists); do not create a new branch.`
    : 'Cut a Conventional branch docs/reference-<slug> from the latest default branch.'

const ONBOARD = 'You are the historian role. Onboard first (engineering-practices project-onboarding): read the project profile for the product, its periods and places, its art direction and visual target, who uses research, the citation style, where research and docs live, and what you may change. Touch nothing outside that scope.'

const DOCS_FRAGMENT = 'Classify every page with the Diataxis compass: the reference set and artist brief are reference; an interpretive choice the art direction rests on is explanation. Keep each page to one kind, open it with a line naming kind and audience, title it by the project pattern, and link to the related pages of the other kinds (the art-direction or design docs, the research briefs).'

const NOTES_RULE = 'Put a problem in the blocking list only if it is a failure you can point to: an item whose holder record cannot be found or does not match, a wrong date or place, a reconstruction not labelled as one, a rights status not backed by the holder\'s own page, sensitive material with no decision recorded, a page of mixed Diataxis kinds, a step that broke a rule of the historian role. Everything else goes in notes; an empty blocking list means done.'

const PLAN = {
  type: 'object',
  properties: {
    scope: { type: 'string', description: 'period, place and people, precisely, and what is out of scope' },
    categories: { type: 'array', items: { type: 'string', enum: Object.keys(CATEGORIES) }, description: 'the categories this subject needs' },
    focus: { type: 'object', additionalProperties: { type: 'string' }, description: 'for each category, what the artists most need to know' },
    existing: { type: 'array', items: { type: 'string' }, description: 'research and reference pages already in the project to reuse' },
    blockers: { type: 'array', items: { type: 'string' }, description: 'only what stops the work' },
  },
  required: ['scope', 'categories', 'existing'],
}
const ITEMS = {
  type: 'object',
  properties: {
    items: { type: 'array', items: { type: 'object', properties: {
      what: { type: 'string' },
      holder: { type: 'string', description: 'museum, library, archive or site, with catalogue, accession or folio number' },
      url: { type: 'string', description: 'the holder\'s own record' },
      date: { type: 'string' },
      place: { type: 'string' },
      evidence: { type: 'string', enum: ['surviving-original', 'contemporary-depiction', 'later-depiction', 'modern-reconstruction', 'replica'] },
      shows: { type: 'string', description: 'what an artist may take from it' },
      limits: { type: 'string', description: 'what it cannot tell them' },
      rights: { type: 'string', description: 'public domain or the open licence, with the holder page that says so; otherwise "reference only, not for reuse"' },
      sensitivity: { type: 'string', description: 'sacred, funerary or restricted for a living community, or "none known"' },
    }, required: ['what', 'holder', 'url', 'date', 'place', 'evidence', 'shows', 'limits', 'rights', 'sensitivity'] } },
    essentials: { type: 'array', items: { type: 'string' }, description: 'forms, materials, palette, proportions, wear: what the artists must get right, each tied to items' },
    avoid: { type: 'array', items: { type: 'string' }, description: 'common errors, anachronisms and stereotypes for this category' },
    gaps: { type: 'array', items: { type: 'string' }, description: 'what no surviving evidence shows, and the inference offered' },
    searchLog: { type: 'array', items: { type: 'string' } },
  },
  required: ['items', 'essentials', 'avoid', 'searchLog'],
}
const VET = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' }, description: 'each naming the category and item' },
    sensitive: { type: 'array', items: { type: 'string' }, description: 'items a living community may hold sacred, funerary or restricted, with why' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'problems', 'sensitive'],
}
const WRITE = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    pages: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] } }, required: ['path', 'kind'] } },
    itemCount: { type: 'integer' },
    placedImages: { type: 'array', items: { type: 'string' }, description: 'image files placed in the project, each public domain or openly licensed and logged per engineering-practices provenance' },
    consultation: { type: 'array', items: { type: 'string' }, description: 'consultation or permission the owner should arrange, with whom and why' },
    undocumented: { type: 'array', items: { type: 'string' } },
  },
  required: ['branch', 'pages', 'itemCount', 'placedImages', 'undocumented'],
}
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, links_ok: { type: 'boolean', description: 'every relative link in the pages resolves' }, problem: { type: 'string' } }, required: ['branch', 'links_ok'] }

const strings = (xs) => (Array.isArray(xs) ? xs.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [])
const notes = []

phase('Plan')
const plan = await agent(
  `${ONBOARD} Then follow the historian skills visual-and-material-reference and history-for-design. Subject: ${subject}. For: ${audience}. Scope: ${scope}.${asked ? ` Categories asked for: ${asked.join(', ')}.` : ` Choose the categories the subject needs from: ${Object.keys(CATEGORIES).join(', ')}.`}
Fix the scope precisely (which people, which place, which decades; elite, ritual and everyday) and what is out of scope. For each category say what the artists most need to know. List research and reference pages already in the project to reuse. Read only; change nothing.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!plan) return { status: 'blocked', reason: 'plan step returned nothing' }
if (strings(plan.blockers).length) return { status: 'blocked', stage: 'plan', open: strings(plan.blockers) }
const chosen = (asked || (Array.isArray(plan.categories) ? plan.categories : [])).map(String).filter((c, i, a) => CATEGORIES[c] && a.indexOf(c) === i)
if (!chosen.length) return { status: 'blocked', stage: 'plan', open: ['no categories chosen for the subject'] }
const focus = plan.focus && typeof plan.focus === 'object' ? plan.focus : {}

phase('Gather')
const gathered = await parallel(chosen.map((k) => () => agent(
  `${ONBOARD} Gather reference for one category per the historian skills visual-and-material-reference, source-criticism and citation-and-evidence${/latin|mexic|maya|andes|andean|inca|aztec|mexica|nahua|caribbean|brazil|peru|colonial/i.test(subject + ' ' + plan.scope) ? ', and latin-american-history' : ''}. Subject: ${subject}. Scope: ${plan.scope}. Category: ${CATEGORIES[k]}. The artists most need: ${focus[k] || 'the forms, materials and palette that make this category right for the period'}.
Find items in holders' own records (museum and library catalogues, digital editions, excavation and site reports), surviving originals first, then contemporary depictions; include reconstructions only labelled as modern, with who made them and on what evidence. For each item record what it is, holder and identifier, the holder's own URL, date and place, kind of evidence, what it shows and what it cannot show, rights status backed by the holder's page (public domain or the open licence named, otherwise "reference only, not for reuse"), and sensitivity for living communities (heritage-ethics). Cover elite, ritual and everyday where they differ, and note regional and period differences. Never invent an item, identifier or URL. Give the essentials the artists must get right, what to avoid, the gaps no evidence fills with the inference you offer, and a search log. Read only; change no files and download nothing.`,
  { schema: ITEMS, phase: 'Gather', label: 'gather:' + k })))
const sets = []
const empty = []
gathered.forEach((g, i) => {
  if (!g || !Array.isArray(g.items)) { empty.push(chosen[i]); return }
  sets.push(Object.assign({ category: chosen[i] }, g))
})
if (!sets.length) return { status: 'blocked', stage: 'gather', open: ['every gather step returned nothing'] }

phase('Vet')
const vet = await agent(
  `You are a historian giving an independent check of a reference set you did not gather. Read only; do not edit anything. Follow the historian skills visual-and-material-reference, heritage-ethics and citation-and-evidence. Scope: ${plan.scope}. Items by category: ${JSON.stringify(sets.map((s) => ({ category: s.category, items: s.items })))}.
Open each item's holder record. Check: 1) the record exists and matches what, identifier, date and place; 2) the kind of evidence is right, and every reconstruction, painting or render is labelled modern; 3) the rights status is backed by the holder's own page, and nothing whose rights are unknown is marked reusable; 4) "shows" claims no more than the item supports (colour after fading or repainting, elite versus everyday, one place standing for a whole civilization); 5) items a living community may hold sacred, funerary or restricted are listed under sensitive with why. Name the category and item in each problem. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.',
  { schema: VET, phase: 'Vet', label: 'vet', independent: true })
if (!vet) return { status: 'unverified', reason: 'item check returned nothing', sets }
strings(vet.notes).forEach((n) => notes.push('vet: ' + n))
const vetProblems = strings(vet.problems).length || vet.pass
  ? strings(vet.problems)
  : ['the item check failed without naming a problem; keep only items whose holder record you can open and that match it']
const sensitive = strings(vet.sensitive)

phase('Write')
const writeSet = (extra) =>
  `${ONBOARD} Write the reference set per the historian skills visual-and-material-reference and history-for-design. ${where} Output: ${output}. Subject: ${subject}. For: ${audience}. Scope: ${plan.scope}. Gathered by category: ${JSON.stringify(sets)}. Existing pages to reuse and link: ${JSON.stringify(strings(plan.existing))}.
${vetProblems.length ? `The independent item check found these problems: drop each affected item or correct it to what its holder record says, and relabel as needed: ${JSON.stringify(vetProblems)}. ` : ''}${sensitive.length ? `These items may be sacred, funerary or restricted for a living community: leave each out of the set unless the project records permission, list them in a "not used, and why" section, and list the consultation the owner should arrange: ${JSON.stringify(sensitive)}. ` : ''}The page leads with the artist brief: the essentials, do and avoid lists tied to items, the gaps and the inferences offered, and a plain statement that reference informs original work and is never traced, copied or photobashed into shipped art. Then one section per category with a table per item: what, holder and identifier with link, date, place, kind of evidence, shows, limits, rights, sensitivity. Link images; place an image file in the project only if its holder marks it public domain or openly licensed, and log it per engineering-practices provenance. Then the search log and bibliography. Link it from the project's art-direction or design docs if they exist. ${DOCS_FRAGMENT} Commit on the branch with a Conventional Commit (docs:). Do not push.${extra}`
let written = await agent(writeSet(''), { schema: WRITE, phase: 'Write', label: 'write' })
if (!written) return { status: 'blocked', reason: 'write step returned nothing', sets }
const pagesOf = (w) => (Array.isArray(w.pages) ? w.pages : []).map((p) => (p && typeof p === 'object'
  ? { path: String(p.path || ''), kind: String(p.kind || '') }
  : { path: String(p), kind: '' })).filter((p) => p.path)
let pages = pagesOf(written)
if (!pages.length) return { status: 'blocked', stage: 'write', open: ['the reference set was not written to any page'] }

phase('Check')
const checkSet = (ps, w) =>
  `You are a historian and technical writer giving an independent check of a reference set you did not write. Read only; do not edit anything. Follow the historian skills visual-and-material-reference and heritage-ethics. Pages on branch ${w.branch}: ${ps.map((p) => `${p.path} (${p.kind})`).join(', ')}. Images placed in the project: ${JSON.stringify(strings(w.placedImages))}. Problems the item check found: ${JSON.stringify(vetProblems)}. Sensitive items: ${JSON.stringify(sensitive)}.
Check: 1) every item has holder and identifier with link, date, place, kind of evidence, shows, limits, rights and sensitivity; 2) every item-check problem was dropped or corrected and every sensitive item is left out or covered by recorded permission; 3) the artist brief's essentials and do and avoid lists are tied to items, and the no-copying statement is there; 4) every placed image is public domain or openly licensed on its holder's page and logged per the project's provenance rule; 5) each category the plan chose has a surviving-evidence item or an explicit gap; 6) each page is one Diataxis kind with a first line naming kind and audience, a title by pattern, and links to related kinds. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.'
let check = await agent(checkSet(pages, written), { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'page check returned nothing', pages: pages.map((p) => p.path) }
strings(check.notes).forEach((n) => notes.push('check: ' + n))
if (strings(check.problems).length || !check.pass) {
  const problems = strings(check.problems)
  written = await agent(writeSet(` Revise the pages on the same branch to fix these check problems, and commit: ${JSON.stringify(problems.length ? problems : ['the check failed without naming a problem; re-check every point'])}.`), { schema: WRITE, phase: 'Check', label: 'revise' })
  if (!written) return { status: 'blocked', reason: 'revision returned nothing', open: problems }
  pages = pagesOf(written)
  check = await agent(checkSet(pages, written), { schema: CHECK, phase: 'Check', label: 'check-again', independent: true })
  if (!check) return { status: 'unverified', reason: 'second page check returned nothing', pages: pages.map((p) => p.path) }
  strings(check.notes).forEach((n) => notes.push('check-again: ' + n))
  if (strings(check.problems).length || !check.pass) return { status: 'blocked', stage: 'check', open: strings(check.problems).length ? strings(check.problems) : ['page check failed twice'], pages: pages.map((p) => p.path), notes }
}
const docPaths = pages.map((p) => p.path)
const docList = pages.map((p) => `${p.path} (${p.kind})`).join(', ')

phase('Hand off')
const handoff = await agent(
  `Hand off this reference set. ${where} Make sure every commit is pushed to ${written.branch}. Check that every relative link in the pages (${docList}) resolves. Look for an open pull request for that branch first${args.pr ? ` (the caller names ${args.pr})` : ''}; update its body if one is open, and open a draft PR titled as a Conventional Commit (docs:) only if none is open. The body states the subject and scope, the categories and item count (${written.itemCount}), the pages by Diataxis kind, images placed in the project with their licences (${JSON.stringify(strings(written.placedImages))}), items left out as sensitive and any consultation the owner should arrange (${JSON.stringify(strings(written.consultation))}); keep lines already in an existing body that are not about these. Do not mark it ready, request review or merge. Follow the engineering-practices git-workflow skill. Return the branch, PR URL, head commit SHA and whether the links resolve.`,
  { schema: HANDOFF, phase: 'Hand off', label: 'handoff' })
if (!handoff || !handoff.branch) return { status: 'blocked', reason: 'hand-off failed; the set is committed on ' + written.branch + ' but may not be pushed', notes }
if (!handoff.links_ok) return { status: 'blocked', open: ['broken links on the pushed head' + (handoff.problem ? ': ' + handoff.problem : '')], notes }

const placed = strings(written.placedImages)
return {
  status: empty.length ? 'partial' : 'done',
  subject,
  scope: plan.scope,
  categories: chosen,
  emptyCategories: empty,
  itemCount: written.itemCount,
  placedImages: placed,
  sensitive,
  consultation: strings(written.consultation),
  docs: docPaths,
  undocumented: strings(written.undocumented),
  notes,
  handoff: {
    from: 'historian:reference-set',
    branch: handoff.branch,
    pr: handoff.pr || '',
    head_sha: handoff.head_sha || '',
    tests_pass: true,
    docs: docPaths,
    undocumented: strings(written.undocumented),
    non_original: placed,
    notes,
  },
  next: (empty.length
    ? `rerun the categories that returned nothing with run.only: [${empty.map((n) => JSON.stringify('gather:' + n)).join(', ')}] and run.results from this run; `
    : '') + `tell ${audience} the set is ready; ${strings(written.consultation).length ? 'raise the consultation needs with the owner; ' : ''}land it: /engineering-practices:land-pr ${handoff.pr ? `{ pr: "${handoff.pr}" }` : `{ branch: "${handoff.branch}" }`}`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
