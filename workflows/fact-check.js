// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'fact-check',
  description: 'Check what a team made against history: list every historical claim, depiction and name in a design, script, asset, scene, UI text, page or pull request, judge them in parallel through four read-only lenses (events and people, material and visual, names and language, representation and heritage) against the project\'s research and the sources, with a verdict for each (supported, recorded departure, error, anachronism, unsupported, representation) and a fix that keeps the intent, have every error, anachronism and representation finding confirmed in an independent read-only pass, write the review and the proposed departures into the project\'s docs, check the pages independently, and push them as a draft docs PR. Changes nothing in the work checked. args: { target: "<files, a PR, a branch, or pasted text to check>", context?: "<period, place, people, and research pages to check against>", owner?: "<role that owns the target and decides the fixes>", output?: "<docs path for the review>", branch?: "<existing branch for the review>", pr?: "<existing PR for the review>" }',
  phases: [
    { title: 'Extract', detail: 'every claim, depiction and name, read-only' },
    { title: 'Assess', detail: 'four lenses in parallel, read-only' },
    { title: 'Confirm', detail: 'independent read-only confirmation of each finding' },
    { title: 'Docs', detail: 'the review and proposed departures, on a branch' },
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

const USAGE = 'usage: fact-check { target: "<files, a PR, a branch, or pasted text>", context: "<period, place, people and research pages, optional>", owner: "<role that owns the target, optional>", output: "<docs path, optional>", branch: "<existing branch, optional>", pr: "<existing PR, optional>" }'
if (!args || !args.target) return USAGE
const target = String(args.target)
const context = args.context ? String(args.context) : 'the period, place and people the project profile and its research pages name'
const owner = args.owner ? String(args.owner) : 'the role the project profile names as owner of the target'
const output = args.output ? String(args.output) : 'the research location the project profile names, as a new reference page titled "Historical review: <target>"'
const where = args.pr
  ? `Work on the existing PR ${args.pr} and its head branch; do not create a new branch or PR.`
  : args.branch
    ? `Work on the existing branch ${args.branch} (reuse its open PR if one exists); do not create a new branch.`
    : 'Cut a Conventional branch docs/historical-review-<slug> from the latest default branch.'

const ONBOARD = 'You are the historian role. Onboard first (engineering-practices project-onboarding): read the project profile for the product, its periods and places, its research pages, glossary, timeline and departures record, the citation style, where docs live, and what you may change. Touch nothing outside that scope, and change nothing in the work being checked.'

const DOCS_FRAGMENT = 'Classify every page with the Diataxis compass: the review and the departures record are reference; the product\'s approach to the past is explanation. Keep each page to one kind, open it with a line naming kind and audience, title it by the project pattern, and link to the related pages of the other kinds.'

const NOTES_RULE = 'Put a problem in the blocking list only if it is a failure you can point to: a finding whose evidence does not hold, a verdict or severity the evidence does not support, a citation that cannot be followed, a fix that would itself be wrong, a page of mixed Diataxis kinds, a step that broke a rule of the historian role. Everything else goes in notes; an empty blocking list means done.'

const LENSES = {
  history: { skill: 'historical-research, source-criticism and citation-and-evidence', text: 'events, people, dates, institutions, beliefs, economy and daily life: what happened, who could be where, what people knew and did' },
  material: { skill: 'visual-and-material-reference', text: 'architecture, objects, dress and adornment, materials, colour, iconography, landscape and sound: what things looked, felt and sounded like, and when and where' },
  language: { skill: 'citation-and-evidence and history-for-design', text: 'names of peoples, places, persons, gods and things; titles and terms; spelling against the project glossary; any text in a historical or Indigenous language' },
  representation: { skill: 'heritage-ethics', text: 'stereotype, flattening, erasure, sacred, funerary or restricted material, the conqueror\'s framing, credit and consultation' },
}
const VERDICTS = ['supported', 'departure-recorded', 'error', 'anachronism', 'unsupported', 'representation']

const EXTRACT = {
  type: 'object',
  properties: {
    claims: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', description: 'c1, c2, ...' }, where: { type: 'string', description: 'file and line, asset, scene, or quoted passage' }, claim: { type: 'string', description: 'what it states or shows about the past, explicit or implied' }, lens: { type: 'string', enum: Object.keys(LENSES) } }, required: ['id', 'where', 'claim', 'lens'] } },
    scope: { type: 'string', description: 'the period, place and people the target depicts' },
    blockers: { type: 'array', items: { type: 'string' }, description: 'only what stops the work: the target cannot be read' },
  },
  required: ['claims', 'scope'],
}
const VERDICT = {
  type: 'object',
  properties: {
    verdicts: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      verdict: { type: 'string', enum: VERDICTS },
      severity: { type: 'string', enum: ['high', 'medium', 'low', 'none'], description: 'high: misrepresents a living people or sacred practice, or is wrong in what the product teaches; medium: a visible error or anachronism; low: background detail; none: supported or recorded' },
      evidence: { type: 'string', description: 'what the sources say, with citations to the exact place' },
      fix: { type: 'string', description: 'a change that keeps the intent, or "record as a departure", or ""' },
    }, required: ['id', 'verdict', 'severity', 'evidence', 'fix'] } },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdicts'],
}
const CONFIRM = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' }, description: 'each naming the claim id: evidence that does not hold, a wrong verdict or severity, a fix that is itself wrong' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'problems'],
}
const DOCS = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    pages: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] } }, required: ['path', 'kind'] } },
    proposedDepartures: { type: 'array', items: { type: 'string' }, description: 'departures for the owner to accept or fix, written as proposals' },
    changes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, withdrawn: { type: 'boolean' }, verdict: { type: 'string', enum: VERDICTS }, severity: { type: 'string', enum: ['high', 'medium', 'low', 'none'] }, fix: { type: 'string' } }, required: ['id', 'withdrawn'] }, description: 'every finding the page withdrew or whose verdict, severity or fix differs from the input, with its final values' },
    undocumented: { type: 'array', items: { type: 'string' } },
  },
  required: ['branch', 'pages', 'proposedDepartures', 'changes', 'undocumented'],
}
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, links_ok: { type: 'boolean', description: 'every relative link in the pages resolves' }, problem: { type: 'string' } }, required: ['branch', 'links_ok'] }

const strings = (xs) => (Array.isArray(xs) ? xs.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [])
const RANK = { high: 0, medium: 1, low: 2, none: 3 }
const notes = []

phase('Extract')
const ex = await agent(
  `${ONBOARD} Then follow the historian skill history-for-design. Target: ${target}. Context: ${context}.
Read the whole target. List every historical claim, depiction and name it makes, explicit or implied (a building's form, a garment, a date, a title, a word, a ritual, who is shown doing what), each with where it is and the lens it belongs to: ${Object.entries(LENSES).map(([k, v]) => `${k} (${v.text})`).join('; ')}. Give each depiction of a people a representation entry too. State the period, place and people the target depicts. Read only; change nothing.`,
  { schema: EXTRACT, phase: 'Extract', label: 'extract' })
if (!ex) return { status: 'blocked', reason: 'extract step returned nothing' }
if (strings(ex.blockers).length) return { status: 'blocked', stage: 'extract', open: strings(ex.blockers) }
const claims = (Array.isArray(ex.claims) ? ex.claims : []).filter((c) => c && c.claim)
if (!claims.length) return { status: 'done', target, scope: ex.scope, findings: [], counts: {}, docs: [], notes: ['the target makes no historical claims'], next: 'nothing to fix' }

phase('Assess')
const lenses = Object.keys(LENSES).filter((k) => claims.some((c) => c.lens === k))
const assessed = await parallel(lenses.map((k) => () => agent(
  `${ONBOARD} Judge one lens of the target per the historian skills ${LENSES[k].skill} and history-for-design. Target: ${target}. Scope: ${ex.scope}. Lens: ${LENSES[k].text}. Claims: ${JSON.stringify(claims.filter((c) => c.lens === k))}.
For each claim, check it against the project's research pages, glossary, timeline and departures record first, then the sources. Give a verdict: supported; departure-recorded (the departures record covers it); error (contradicts the evidence); anachronism (belongs to another time or place); unsupported (no evidence either way); representation (fails a heritage-ethics check). Give the severity (high, medium, low, none), the evidence with citations to the exact place, and a fix that keeps the intent of the work, or "record as a departure" where an invention is fine but unrecorded. Cite only what you opened. Read only; change nothing in the target or the docs.`,
  { schema: VERDICT, phase: 'Assess', label: 'assess:' + k })))
const findings = []
const unassessed = []
assessed.forEach((a, i) => {
  const k = lenses[i]
  if (!a || !Array.isArray(a.verdicts)) { unassessed.push(k); return }
  strings(a.notes).forEach((n) => notes.push(`${k}: ${n}`))
  a.verdicts.forEach((v) => {
    const c = claims.find((x) => x.id === v.id) || {}
    findings.push(Object.assign({ lens: k, where: c.where || '', claim: c.claim || '' }, v))
  })
})
findings.sort((a, b) => (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9))
const flagged = findings.filter((f) => ['error', 'anachronism', 'representation'].includes(f.verdict))

phase('Confirm')
let confirmProblems = []
if (flagged.length) {
  const conf = await agent(
    `You are a historian giving an independent check of findings you did not make. Read only; do not edit anything. Follow the historian skills source-criticism, citation-and-evidence and heritage-ethics. Scope: ${ex.scope}. Findings: ${JSON.stringify(flagged)}.
For each finding open the cited evidence and check: 1) the evidence exists as cited and says what the finding says; 2) the verdict is right (an error contradicts the evidence; an anachronism belongs elsewhere in time or place; a representation finding fails a heritage-ethics check), and a choice the record leaves open is not called an error; 3) the severity fits the harm; 4) the fix is itself accurate and keeps the work's intent. Name the claim id in each problem. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.',
    { schema: CONFIRM, phase: 'Confirm', label: 'confirm', independent: true })
  if (!conf) return { status: 'unverified', reason: 'confirmation returned nothing', findings }
  strings(conf.notes).forEach((n) => notes.push('confirm: ' + n))
  confirmProblems = strings(conf.problems)
}

phase('Docs')
const docsBrief = (extra) =>
  `${ONBOARD} Write the historical review per the historian skill history-for-design. ${where} Output: ${output}. Target: ${target}. Owner of the target: ${owner}. Scope: ${ex.scope}. Findings, most severe first: ${JSON.stringify(findings)}.
${confirmProblems.length ? `The independent confirmation disputed these findings: correct each to what the evidence supports, or withdraw it and say so on the page: ${JSON.stringify(confirmProblems)}. ` : ''}Return under changes every finding you withdrew or whose verdict, severity or fix you changed, with its final values. The page leads with the counts by verdict and severity and the findings that need the owner's decision, then a table of every claim (where, claim, verdict, severity, evidence, fix), then the claims that are supported. Every "record as a departure" and every unsupported invention becomes a proposed entry for the project's departures record (what the product does, what history says, why it might depart, who must decide), marked as proposed: the owner decides, not you. Do not edit the target. ${DOCS_FRAGMENT} Commit on the branch with a Conventional Commit (docs:). Do not push.${extra}`
let docs = await agent(docsBrief(''), { schema: DOCS, phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'blocked', reason: 'docs step failed; the review is not done without its record', findings }
const pagesOf = (d) => (Array.isArray(d.pages) ? d.pages : []).map((p) => (p && typeof p === 'object'
  ? { path: String(p.path || ''), kind: String(p.kind || '') }
  : { path: String(p), kind: '' })).filter((p) => p.path)
let pages = pagesOf(docs)
if (!pages.length) return { status: 'blocked', stage: 'docs', open: ['the review was not written to any page'], findings }

phase('Check')
const checkBrief = (ps, d) =>
  `You are a technical writer giving an independent check of a historical review you did not write. Read only; do not edit anything. Pages on branch ${d.branch}: ${ps.map((p) => `${p.path} (${p.kind})`).join(', ')}. Findings they must carry: ${JSON.stringify(findings.map((f) => ({ id: f.id, verdict: f.verdict, severity: f.severity })))}. Disputed findings: ${JSON.stringify(confirmProblems)}.
Check: 1) every finding appears with its verdict, severity, evidence and fix, and every disputed finding was corrected or withdrawn; 2) nothing is claimed that the findings do not support; 3) departures are written as proposals for the owner, not as decisions; 4) the target itself was not changed; 5) each page is one Diataxis kind with a first line naming kind and audience, a title by pattern and links to related kinds. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.'
let check = await agent(checkBrief(pages, docs), { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'review check returned nothing', findings, docs: pages.map((p) => p.path) }
strings(check.notes).forEach((n) => notes.push('check: ' + n))
if (strings(check.problems).length || !check.pass) {
  const problems = strings(check.problems)
  docs = await agent(docsBrief(` Revise the pages on the same branch to fix these check problems, and commit: ${JSON.stringify(problems.length ? problems : ['the check failed without naming a problem; re-check every point'])}.`), { schema: DOCS, phase: 'Check', label: 'revise' })
  if (!docs) return { status: 'blocked', reason: 'revision returned nothing', open: problems, findings }
  pages = pagesOf(docs)
  check = await agent(checkBrief(pages, docs), { schema: CHECK, phase: 'Check', label: 'check-again', independent: true })
  if (!check) return { status: 'unverified', reason: 'second review check returned nothing', findings, docs: pages.map((p) => p.path) }
  strings(check.notes).forEach((n) => notes.push('check-again: ' + n))
  if (strings(check.problems).length || !check.pass) return { status: 'blocked', stage: 'check', open: strings(check.problems).length ? strings(check.problems) : ['review check failed twice'], findings, docs: pages.map((p) => p.path), notes }
}
const docPaths = pages.map((p) => p.path)
const docList = pages.map((p) => `${p.path} (${p.kind})`).join(', ')

phase('Hand off')
const handoff = await agent(
  `Hand off this historical review. ${where} Make sure every commit is pushed to ${docs.branch}. Check that every relative link in the pages (${docList}) resolves. Look for an open pull request for that branch first${args.pr ? ` (the caller names ${args.pr})` : ''}; update its body if one is open, and open a draft PR titled as a Conventional Commit (docs:) only if none is open. The body states the target, the counts by verdict and severity, the findings that need the owner's decision, the proposed departures and the pages by Diataxis kind; keep lines already in an existing body that are not about these. Do not mark it ready, request review or merge. Follow the engineering-practices git-workflow skill. Return the branch, PR URL, head commit SHA and whether the links resolve.`,
  { schema: HANDOFF, phase: 'Hand off', label: 'handoff' })
if (!handoff || !handoff.branch) return { status: 'blocked', reason: 'hand-off failed; the review is committed on ' + docs.branch + ' but may not be pushed', findings, notes }
if (!handoff.links_ok) return { status: 'blocked', open: ['broken links on the pushed head' + (handoff.problem ? ': ' + handoff.problem : '')], findings, notes }

// The page is the record: apply what Docs (or its revision) withdrew or changed.
const withdrawn = []
;(Array.isArray(docs.changes) ? docs.changes : []).forEach((c) => {
  if (!c || !c.id) return
  const i = findings.findIndex((f) => f.id === c.id)
  if (i < 0) return
  if (c.withdrawn) { withdrawn.push(findings[i]); findings.splice(i, 1); return }
  ;['verdict', 'severity', 'fix'].forEach((k) => { if (typeof c[k] === 'string' && c[k]) findings[i][k] = c[k] })
})
findings.sort((a, b) => (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9))
const counts = VERDICTS.reduce((o, v) => Object.assign(o, { [v]: findings.filter((f) => f.verdict === v).length }), {})
const toFix = findings.filter((f) => f.severity !== 'none' && f.verdict !== 'supported' && f.verdict !== 'departure-recorded')
return {
  status: unassessed.length ? 'partial' : 'done',
  target,
  scope: ex.scope,
  counts,
  findings,
  withdrawn,
  unassessedLenses: unassessed,
  proposedDepartures: strings(docs.proposedDepartures),
  docs: docPaths,
  undocumented: strings(docs.undocumented),
  notes,
  handoff: {
    from: 'historian:fact-check',
    branch: handoff.branch,
    pr: handoff.pr || '',
    head_sha: handoff.head_sha || '',
    tests_pass: true,
    docs: docPaths,
    undocumented: strings(docs.undocumented),
    non_original: [],
    notes,
  },
  next: (unassessed.length
    ? `rerun the lenses that returned nothing with run.only: [${unassessed.map((n) => JSON.stringify('assess:' + n)).join(', ')}] and run.results from this run; `
    : '') + `send the ${toFix.length} finding(s) to fix and the proposed departures to ${owner}, most severe first; land the review: /engineering-practices:land-pr ${handoff.pr ? `{ pr: "${handoff.pr}" }` : `{ branch: "${handoff.branch}" }`}`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
