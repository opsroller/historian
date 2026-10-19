// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'research-brief',
  description: 'Answer one historical question for the people who will build on it: restate the need as research questions tied to the decisions they feed, research each question in parallel from primary sources and current scholarship with a search log, have every cited source and the claims drawn from it checked in an independent read-only pass, write the brief (answer and confidence, what it means for each role, must / opportunities / free to invent / avoid, claim ledger, debates, bibliography) into the project\'s research docs, check it independently for accuracy, heritage and Diataxis form with one revision, and push it as a draft docs PR. args: { question: "<what the team needs to know>", for?: "<who will use it and the decision it feeds>", scope?: "<period, place, people>", depth?: "quick"|"brief"|"study" (default "brief"), output?: "<docs path for the brief>", branch?: "<existing branch>", pr?: "<existing PR>" }',
  phases: [
    { title: 'Scope', detail: 'need, decisions, research questions, depth, read-only' },
    { title: 'Research', detail: 'one researcher per question, in parallel, read-only' },
    { title: 'Sources', detail: 'independent read-only check of citations and claims' },
    { title: 'Write', detail: 'the brief and the shared references it touches, on a branch' },
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

const USAGE = 'usage: research-brief { question: "<what the team needs to know>", for: "<who will use it and the decision it feeds, optional>", scope: "<period, place, people, optional>", depth: "quick"|"brief"|"study" (optional, default "brief"), output: "<docs path, optional>", branch: "<existing branch, optional>", pr: "<existing PR, optional>" }'
if (!args || !args.question) return USAGE
const question = String(args.question)
const audience = args.for ? String(args.for) : 'the roles the project profile names as users of research (design, art, writing, audio, UI, direction)'
const scope = args.scope ? String(args.scope) : 'the period, place and people the question and the project profile imply; state them precisely'
const depth = ['quick', 'brief', 'study'].includes(args.depth) ? args.depth : 'brief'
const output = args.output ? String(args.output) : 'the research location the project profile names, as a new reference page titled for the subject'
const where = args.pr
  ? `Work on the existing PR ${args.pr} and its head branch; do not create a new branch or PR.`
  : args.branch
    ? `Work on the existing branch ${args.branch} (reuse its open PR if one exists); do not create a new branch.`
    : 'Cut a Conventional branch docs/research-<slug> from the latest default branch.'

const ONBOARD = 'You are the historian role. Onboard first (engineering-practices project-onboarding): read the project profile for the product, its periods and places, who uses research, the citation style (Chicago notes and bibliography unless it names another), where research and docs live, and what you may change. Touch nothing outside that scope.'

const DOCS_FRAGMENT = 'Classify every page with the Diataxis compass (action/cognition x study/work): the brief, timeline, glossary and naming guide are reference; the debates and reasons behind a choice are explanation. Keep each page to one kind, open it with a line naming kind and audience, title it by the project pattern, and link to the related pages of the other kinds.'

const NOTES_RULE = 'Put a problem in the blocking list only if it is a failure you can point to: a citation that cannot be found or does not say what is claimed, a claim with no source, a wrong grade, a misnamed people or place, a heritage check failed, a page of mixed Diataxis kinds, a step that broke a rule of the historian role. Everything else goes in notes; an empty blocking list means done.'

const SCOPE = {
  type: 'object',
  properties: {
    need: { type: 'string', description: 'who needs the answer and the decision it feeds' },
    scope: { type: 'string', description: 'period, place and people, precisely, and what is out of scope' },
    questions: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', description: 'short kebab-case id' }, question: { type: 'string' }, feeds: { type: 'string', description: 'the decision this answer feeds' }, lookIn: { type: 'string', description: 'where the answer is likely to be: source types, archives, digital editions, collections, scholarship, languages' } }, required: ['id', 'question', 'feeds', 'lookIn'] } },
    existing: { type: 'array', items: { type: 'string' }, description: 'research pages already in the project that answer part of this, to reuse' },
    blockers: { type: 'array', items: { type: 'string' }, description: 'only what stops the work: the need is unclear with no way to proceed, or it is outside the project scope' },
  },
  required: ['need', 'scope', 'questions', 'existing'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: 'the answer to this question in two or three sentences, or "unknown" with why' },
    claims: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, grade: { type: 'string', enum: ['attested', 'inferred', 'contested', 'unknown'] }, sources: { type: 'array', items: { type: 'string' }, description: 'short citations to the exact page, folio, plate or object' }, note: { type: 'string', description: 'corroboration, conflict, the argument for an inference' } }, required: ['claim', 'grade', 'sources'] } },
    sources: { type: 'array', items: { type: 'object', properties: { citation: { type: 'string', description: 'full citation in the project style, with stable URL and consultation date for online records' }, kind: { type: 'string', enum: ['primary', 'secondary', 'reference'] }, judgement: { type: 'string', description: 'maker, date, purpose, how they could know, edition or translation, bias' } }, required: ['citation', 'kind', 'judgement'] } },
    debates: { type: 'array', items: { type: 'string' }, description: 'disagreements in sources or scholarship, both sides named' },
    searchLog: { type: 'array', items: { type: 'string' }, description: 'where you searched, with what terms, and what you found, including nothing' },
    heritage: { type: 'array', items: { type: 'string' }, description: 'living communities, sacred or restricted material, naming issues this touches' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['answer', 'claims', 'sources', 'searchLog'],
}
const SOURCECHECK = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' }, description: 'citations that could not be found, do not say what is claimed, or cite the wrong edition; claims graded higher than their evidence; key claims resting on one source not marked so' },
    verified: { type: 'array', items: { type: 'string' }, description: 'citations opened and confirmed' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'problems', 'verified'],
}
const WRITE = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    pages: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] } }, required: ['path', 'kind'] } },
    answer: { type: 'string', description: 'the brief\'s headline answer with its confidence' },
    consultation: { type: 'array', items: { type: 'string' }, description: 'consultation or permission the owner should arrange, with whom and why' },
    undocumented: { type: 'array', items: { type: 'string' } },
  },
  required: ['branch', 'pages', 'answer', 'undocumented'],
}
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, links_ok: { type: 'boolean', description: 'every relative link in the pages resolves' }, problem: { type: 'string' } }, required: ['branch', 'links_ok'] }

const strings = (xs) => (Array.isArray(xs) ? xs.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [])
const notes = []
const DEPTH = {
  quick: 'Depth: quick answer. One or two good sources per question, stated as provisional.',
  brief: 'Depth: brief. The main primary sources where they can be read, the best current scholarship, and the debates named.',
  study: 'Depth: study. Exhaustive for the question: primary sources read in the best editions, the scholarship surveyed, every debate traced.',
}[depth]

phase('Scope')
const sc = await agent(
  `${ONBOARD} Then follow the historian skills historical-research and history-for-design. Question: ${question}. For: ${audience}. Scope: ${scope}. ${DEPTH}
Restate the need: who needs the answer and the decision it feeds. Fix the scope precisely (which people, which place, which decades) and what is out of scope. Split the question into at most six open research questions, one idea each, each with the decision it feeds and where its answer is likely to be found (source types, archives, digital editions, collections, scholarship, languages; for Latin America follow latin-american-history). List research pages already in the project that answer part of it. Read only; change nothing.`,
  { schema: SCOPE, phase: 'Scope', label: 'scope' })
if (!sc) return { status: 'blocked', reason: 'scope step returned nothing' }
if (strings(sc.blockers).length) return { status: 'blocked', stage: 'scope', open: strings(sc.blockers) }
const questions = (Array.isArray(sc.questions) ? sc.questions : []).filter((q) => q && q.question).slice(0, 6)
if (!questions.length) return { status: 'blocked', stage: 'scope', open: ['no research questions came out of the scope step'] }
const ids = questions.map((q, i) => String(q.id || `q${i + 1}`).replace(/[^a-z0-9-]/gi, '-').toLowerCase() || `q${i + 1}`)
const uniq = ids.map((id, i) => (ids.indexOf(id) === i ? id : `${id}-${i + 1}`))

phase('Research')
const found = await parallel(questions.map((q, i) => () => agent(
  `${ONBOARD} Research one question per the historian skills historical-research, source-criticism and citation-and-evidence${/latin|mexic|maya|andes|andean|inca|aztec|mexica|nahua|caribbean|brazil|peru|colonial/i.test(question + ' ' + sc.scope + ' ' + q.question) ? ', and latin-american-history' : ''}. Scope: ${sc.scope}. Need: ${sc.need}. Question: ${q.question} (it feeds: ${q.feeds}). Start with: ${q.lookIn}. ${DEPTH}
Search catalogues, digital editions, collections and scholarship in the sources' and the scholarship's languages, primary sources first where they survive. Judge every source before using it (maker, date, purpose, how they could know, edition or translation, bias) and corroborate any claim the product will build on with an independent source. Cite only what you opened, to the exact page, folio, plate or object, in the project's style; never invent or reconstruct a citation from memory. Grade each claim attested, inferred, contested or unknown. Keep a search log including searches that found nothing. Note living communities, sacred or restricted material and naming issues it touches (heritage-ethics). Read only; change no files.`,
  { schema: FINDINGS, phase: 'Research', label: 'research:' + uniq[i] })))
const research = []
const unanswered = []
found.forEach((f, i) => {
  if (!f || !Array.isArray(f.claims)) { unanswered.push(uniq[i]); return }
  research.push(Object.assign({ id: uniq[i], question: questions[i].question, feeds: questions[i].feeds }, f))
})
if (!research.length) return { status: 'blocked', stage: 'research', open: ['every research step returned nothing'], questions: questions.map((q) => q.question) }
const allSources = research.flatMap((r) => (Array.isArray(r.sources) ? r.sources : []))
const allClaims = research.flatMap((r) => (Array.isArray(r.claims) ? r.claims.map((c) => Object.assign({ q: r.id }, c)) : []))

phase('Sources')
const srcCheck = await agent(
  `You are a historian giving an independent check of research you did not do. Read only; do not edit anything. Follow the historian skills source-criticism and citation-and-evidence. Scope: ${sc.scope}. Sources cited: ${JSON.stringify(allSources)}. Claims drawn from them: ${JSON.stringify(allClaims)}.
Open each cited source at the place cited (the holder's own catalogue or digital edition, the book or article). Check: 1) it exists as cited, in that edition, with that identifier; 2) it says what the claim says it says; 3) the grade is no higher than the evidence (a single source is not corroboration; two sources that copy each other count as one); 4) primary and secondary are named correctly for the question; 5) no claim rests only on an encyclopedia, a popular site or generated text. List what you verified. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.',
  { schema: SOURCECHECK, phase: 'Sources', label: 'sources', independent: true })
if (!srcCheck) return { status: 'unverified', reason: 'source check returned nothing', research }
strings(srcCheck.notes).forEach((n) => notes.push('sources: ' + n))
const sourceProblems = strings(srcCheck.problems)

phase('Write')
const writeBrief = (extra) =>
  `${ONBOARD} Write the research brief per the historian skills history-for-design and citation-and-evidence. ${where} Output: ${output}. Question: ${question}. Need: ${sc.need}. Scope: ${sc.scope}. Research by question: ${JSON.stringify(research)}. Existing pages to reuse and link: ${JSON.stringify(strings(sc.existing))}.
${sourceProblems.length ? `The independent source check found these problems: remove each affected claim, or regrade it to what the verified evidence supports, and say so in the brief's notes: ${JSON.stringify(sourceProblems)}. ` : ''}The brief leads with the answer and its confidence, then sections: what it means for each role (${audience}); must; opportunities; free to invent; avoid; the claim ledger (claim, grade, sources, notes) covering every claim the product builds on; debates with both sides; open questions and what would settle them; source notes judging each major source; bibliography; search log. Cite only what the research verified. Add new names and dates to the project's glossary or naming guide and timeline if it keeps them (create them only if the profile says where). Write an explanation page only if a debate needs more than the brief's paragraph. List any consultation or permission the owner should arrange (heritage-ethics). ${DOCS_FRAGMENT} Commit on the branch with a Conventional Commit (docs:). Do not push.${extra}`
let written = await agent(writeBrief(''), { schema: WRITE, phase: 'Write', label: 'write' })
if (!written) return { status: 'blocked', reason: 'write step returned nothing', research }
const pagesOf = (w) => (Array.isArray(w.pages) ? w.pages : []).map((p) => (p && typeof p === 'object'
  ? { path: String(p.path || ''), kind: String(p.kind || '') }
  : { path: String(p), kind: '' })).filter((p) => p.path)
let pages = pagesOf(written)
if (!pages.length) return { status: 'blocked', stage: 'write', open: ['the brief was not written to any page'] }

phase('Check')
const checkBrief = (ps) =>
  `You are a historian and technical writer giving an independent check of a research brief you did not write. Read only; do not edit anything. Follow the historian skills citation-and-evidence, heritage-ethics and history-for-design. Pages on branch ${written.branch}: ${ps.map((p) => `${p.path} (${p.kind})`).join(', ')}. Verified research: ${JSON.stringify(research.map((r) => ({ id: r.id, answer: r.answer, claims: r.claims })))}. Problems the source check found: ${JSON.stringify(sourceProblems)}.
Check: 1) the headline answer and every claim in the ledger match the research and keep its grades, and no claim appears that the research does not support; 2) every source-check problem was removed or regraded; 3) evidence, inference and invention are kept apart, and contested points name both sides; 4) each role gets what it means for them, with must, opportunities, free to invent and avoid; 5) peoples, places and terms are named precisely and consistently, with no stereotype or conqueror's framing presented as neutral, and sacred or restricted material flagged (heritage-ethics); 6) each page is one Diataxis kind with a first line naming kind and audience, a title by pattern, and links to related kinds; 7) citations follow the project style and can be followed to an exact place. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.'
let check = await agent(checkBrief(pages), { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'brief check returned nothing', pages: pages.map((p) => p.path), research }
strings(check.notes).forEach((n) => notes.push('check: ' + n))
if (strings(check.problems).length || !check.pass) {
  const problems = strings(check.problems)
  written = await agent(writeBrief(` Revise the pages on the same branch to fix these check problems, and commit: ${JSON.stringify(problems.length ? problems : ['the check failed without naming a problem; re-check every point'])}.`), { schema: WRITE, phase: 'Check', label: 'revise' })
  if (!written) return { status: 'blocked', reason: 'revision returned nothing', open: problems }
  pages = pagesOf(written)
  check = await agent(checkBrief(pages), { schema: CHECK, phase: 'Check', label: 'check-again', independent: true })
  if (!check) return { status: 'unverified', reason: 'second brief check returned nothing', pages: pages.map((p) => p.path) }
  strings(check.notes).forEach((n) => notes.push('check-again: ' + n))
  if (strings(check.problems).length || !check.pass) return { status: 'blocked', stage: 'check', open: strings(check.problems).length ? strings(check.problems) : ['brief check failed twice'], pages: pages.map((p) => p.path), notes }
}
const docPaths = pages.map((p) => p.path)
const docList = pages.map((p) => `${p.path} (${p.kind})`).join(', ')

phase('Hand off')
const handoff = await agent(
  `Hand off this research. ${where} Make sure every commit is pushed to ${written.branch}. Check that every relative link in the pages (${docList}) resolves. Look for an open pull request for that branch first${args.pr ? ` (the caller names ${args.pr})` : ''}; update its body if one is open, and open a draft PR titled as a Conventional Commit (docs:) only if none is open. The body states the question, the headline answer and its confidence (${written.answer}), the pages by Diataxis kind, any consultation the owner should arrange (${JSON.stringify(strings(written.consultation))}), and the questions left open; keep lines already in an existing body that are not about these. Do not mark it ready, request review or merge. Follow the engineering-practices git-workflow skill. Return the branch, PR URL, head commit SHA and whether the links resolve.`,
  { schema: HANDOFF, phase: 'Hand off', label: 'handoff' })
if (!handoff || !handoff.branch) return { status: 'blocked', reason: 'hand-off failed; the brief is committed on ' + written.branch + ' but may not be pushed', notes }
if (!handoff.links_ok) return { status: 'blocked', open: ['broken links on the pushed head' + (handoff.problem ? ': ' + handoff.problem : '')], notes }

return {
  status: unanswered.length ? 'partial' : 'done',
  question,
  answer: written.answer,
  scope: sc.scope,
  questions: research.map((r) => ({ id: r.id, question: r.question, answer: r.answer })),
  unanswered,
  consultation: strings(written.consultation),
  docs: docPaths,
  undocumented: strings(written.undocumented),
  notes,
  handoff: {
    from: 'historian:research-brief',
    branch: handoff.branch,
    pr: handoff.pr || '',
    head_sha: handoff.head_sha || '',
    tests_pass: true,
    docs: docPaths,
    undocumented: strings(written.undocumented),
    non_original: [],
    notes,
  },
  next: (unanswered.length
    ? `rerun the questions that returned nothing with run.only: [${unanswered.map((n) => JSON.stringify('research:' + n)).join(', ')}] and run.results from this run; `
    : '') + `tell the roles that asked; ${strings(written.consultation).length ? 'raise the consultation needs with the owner; ' : ''}land the brief: /engineering-practices:land-pr ${handoff.pr ? `{ pr: "${handoff.pr}" }` : `{ branch: "${handoff.branch}" }`}`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
