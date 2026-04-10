# Detailed Task List (DTL)
## Music Structure Analyzer — Execution Document

---

**Version:** 0.1 (initial draft)
**Date:** 2026-04-10
**Based on:** `docs/PRD.md` v1.0
**Status:** Draft — pending user review

---

## How to read this document

- **PRD vs DTL**
  - `docs/PRD.md` = "WHAT to build" (product spec, frozen unless user asks to revise).
  - `docs/DTL.md` (this file) = "HOW to build & current progress" (living document, updated as work proceeds).
- **Phases** map 1:1 to PRD milestones M0–M6, plus a new **Phase 0 (Pre-investigation)** that PRD does not cover.
- **Task ID format**: `P{phase}-{seq}` (e.g., `P0-01`). Sub-tasks use `.1, .2, ...`.
- **Status values**: `TODO` / `IN PROGRESS` / `BLOCKED` / `DONE` / `SKIPPED`.
- **Each task specifies**: Input, Output, Done criteria, Dependencies, Difficulty (S/M/L/XL), Notes.

---

## Task schema (template)

```
### P{N}-{NN}: {Task name}
- Status: TODO
- Difficulty: S / M / L / XL
- Dependencies: (task IDs or "none")
- Input: (what is needed before starting)
- Output: (concrete artifact or state change)
- Done criteria: (how we verify completion)
- Notes: (design decisions, caveats, links)
```

Difficulty rubric: **S** ≈ <½ day · **M** ≈ 1 day · **L** ≈ 2–3 days · **XL** ≈ >3 days (split further).

---

# Phase 0 — Pre-investigation

**Goal:** Understand ChordMiniApp's internals well enough to plan surgical customization. No code changes yet.
**Why this phase exists:** PRD assumes fork, but never audits the fork. Without this audit we cannot estimate M1–M4 accurately or identify upstream features we should reuse instead of rewriting.

### P0-01: Read ChordMiniApp README + high-level architecture
- Status: TODO
- Difficulty: S
- Dependencies: none
- Input: github.com/ptnghia-j/ChordMiniApp
- Output: Short notes in DTL appendix A.1 — "ChordMiniApp overview"
- Done criteria: Can answer: directory layout? entry points? which services run where? license/attribution requirements?
- Notes: Do NOT clone yet. Read via web first to keep disk clean.

### P0-02: Map existing features → PRD requirements
- Status: TODO
- Difficulty: M
- Dependencies: P0-01
- Input: ChordMiniApp feature list, PRD §3
- Output: Gap matrix in DTL appendix A.2 — columns: `PRD feature | Upstream status (have/partial/none) | Customization strategy`
- Done criteria: Every PRD P0/P1 feature has a row. "Partial" rows state exactly what is missing.
- Notes: This matrix drives all downstream task sizing. Be honest about "partial" — over-optimism here causes M3 slip.

### P0-03: Identify customization touchpoints
- Status: TODO
- Difficulty: M
- Dependencies: P0-02
- Input: Gap matrix
- Output: DTL appendix A.3 — list of upstream files/modules we expect to modify, grouped by concern (UI, chord post-processing, routing, etc.)
- Done criteria: Each file has a one-line "why" and expected edit size (small/medium/rewrite).
- Notes: Prefer minimal surgical edits. Flag any file where a rewrite feels necessary — that is a risk signal.

### P0-04: Verify ML model availability & CPU feasibility
- Status: TODO
- Difficulty: M
- Dependencies: P0-01
- Input: ChordMiniApp model list (SongFormer, Beat-Transformer, Chord-CNN-LSTM, BTC)
- Output: Notes on (a) model weights download path, (b) approximate runtime on CPU for a 3-min track, (c) memory footprint
- Done criteria: Confirmed each model can run on the target EC2 tier; or flagged as a risk with mitigation.
- Notes: PRD §7 already flags CPU speed. This task produces the data to decide EC2 instance size.

### P0-05: Review upstream license & attribution obligations
- Status: TODO
- Difficulty: S
- Dependencies: P0-01
- Input: ChordMiniApp LICENSE file, third-party model licenses
- Output: Short compliance note — what attribution we must preserve, what we can rename/rebrand.
- Done criteria: Clear yes/no on: (1) can we close-source our fork? (2) what notices must appear in UI/README?
- Notes: ChordMiniApp is MIT, so likely permissive. Models may have separate licenses.

### P0-06: Decide Phase 1 entry conditions
- Status: TODO
- Difficulty: S
- Dependencies: P0-02, P0-03, P0-04, P0-05
- Input: All Phase 0 outputs
- Output: Go/No-Go decision, recorded as a short note at the top of Phase 1.
- Done criteria: User has reviewed Phase 0 findings and approved fork execution.
- Notes: If gap matrix shows too much missing work, we may revisit "fork vs build from scratch".

---

# Phase 1 — M0: Fork + Local Environment Setup

**Goal:** Running ChordMiniApp locally on the developer machine, with our own fork as origin.

### P1-01: Fork ChordMiniApp to our account
- Status: TODO
- Difficulty: S
- Dependencies: P0-06 (Go decision)
- Input: GitHub account
- Output: Fork repository URL
- Done criteria: Fork exists and is accessible.
- Notes: Fork into the account the user designates. Preserve upstream as a remote for future sync.

### P1-02: Decide integration strategy — subtree vs submodule vs copy
- Status: TODO
- Difficulty: S
- Dependencies: P1-01
- Input: Current repo structure (`docs/` only), fork repo
- Output: Decision documented here; affects all following tasks.
- Done criteria: Written decision with rationale. User-approved.
- Notes: Options:
  - **(a) Merge fork INTO this repo** (this repo becomes the fork + our docs). Clean history, single repo.
  - **(b) Place fork as a sibling directory** under `app/` or similar, keep `docs/` top-level.
  - **(c) Git submodule** (more complex, usually worse for forks).
  - Recommend (a) unless there's a reason to keep docs separate.

### P1-03: Integrate fork into repository
- Status: TODO
- Difficulty: M
- Dependencies: P1-02
- Input: Decision from P1-02
- Output: Fork code present in this repository; `upstream` remote configured.
- Done criteria: `git log` shows fork history; `git remote -v` shows both `origin` (ours) and `upstream` (ChordMiniApp).
- Notes: Be very careful not to overwrite `docs/PRD.md`, `docs/DTL.md`, `CLAUDE.md`.

### P1-04: Install backend Python environment
- Status: TODO
- Difficulty: M
- Dependencies: P1-03
- Input: Backend directory, upstream `requirements.txt` (or equivalent)
- Output: Working `.venv` with all Python deps installed.
- Done criteria: `python -c "import <key modules>"` runs without error; `pip list` matches `requirements.txt`.
- Notes: Target Python version depends on ChordMiniApp — confirm in P0-01. Use `.venv` **inside `backend/`**, not in repo root.

### P1-05: Install frontend Node environment
- Status: TODO
- Difficulty: S
- Dependencies: P1-03
- Input: Frontend directory, `package.json`
- Output: `node_modules` installed; dev server starts.
- Done criteria: `npm run dev` (or pnpm) brings up a local page without console errors.
- Notes: Confirm package manager from lockfile (`package-lock.json` vs `pnpm-lock.yaml`).

### P1-06: Download ML model weights
- Status: TODO
- Difficulty: M
- Dependencies: P1-04
- Input: Model download instructions from P0-04
- Output: Weight files in expected paths; backend loads them.
- Done criteria: Backend startup log shows all models loaded.
- Notes: Weights may be large. Ensure `.gitignore` covers them.

### P1-07: End-to-end smoke test with a known YouTube URL
- Status: TODO
- Difficulty: M
- Dependencies: P1-04, P1-05, P1-06
- Input: Test YouTube URL (choose a song whose correct Key/BPM/form is known)
- Output: Analysis runs end-to-end; result JSON captured.
- Done criteria: Key, BPM, chord list, and song-structure labels are all produced without errors.
- Notes: Save the test URL and reference output — we'll reuse it as a regression check in every phase.

### P1-08: Document local setup in `README.md` (or equivalent)
- Status: TODO
- Difficulty: S
- Dependencies: P1-07
- Input: Install steps we took
- Output: Setup instructions a second developer can follow.
- Done criteria: Another fresh checkout can be stood up by following the doc.
- Notes: Keep it minimal; link to upstream docs where appropriate instead of duplicating.

---

# Phase 2 — M1 + M2: UI Customization

**Goal:** Browser output matches PRD §4.2 layout for the "top card" (Key/Scale/Time/BPM) and the Song Form one-line summary.

### P2-01: Locate upstream result page component
- Status: TODO
- Difficulty: S
- Dependencies: P1-07
- Input: Fork source
- Output: File path of the analysis result page/component documented here.
- Done criteria: Component file identified and read.

### P2-02: Design custom result page layout (no code)
- Status: TODO
- Difficulty: M
- Dependencies: P2-01
- Input: PRD §4.2, image reference (if available)
- Output: Wireframe or text description of the final layout.
- Done criteria: Layout explicitly places: song title, Key+Scale table, Time, BPM, Song Form summary, Pattern section (stub), YouTube embed, download buttons.
- Notes: User review required before implementation.

### P2-03: Implement "Song Info Card" component
- Status: TODO
- Difficulty: M
- Dependencies: P2-02
- Input: Layout decision, analysis result shape
- Output: React component rendering Key/Scale/Time/BPM from analysis JSON.
- Done criteria: With a hardcoded sample JSON, the card matches the design.
- Notes: Scale table cell rendering (Bb=1, C=2, …) is a small custom widget — keep it isolated.

### P2-04: SongFormer label → abbreviation mapping
- Status: TODO
- Difficulty: M
- Dependencies: P1-07
- Input: Actual SongFormer output labels (from P1-07 smoke test)
- Output: Mapping table `{songformer_label → abbrev}` and a pure function applying it.
- Done criteria: Unit test maps all observed labels to I/V/PC/C/B/Inst/O without throwing.
- Notes: **Pre-Chorus is the hard case** — SongFormer may not emit it. Heuristic (PRD §7): short segment between verse and chorus → PC. Document the exact rule.

### P2-05: Song Form summary renderer
- Status: TODO
- Difficulty: S
- Dependencies: P2-04
- Input: Mapped labels + segment order
- Output: One-line summary rendered as `I > V > PC > C > B > …`.
- Done criteria: Matches PRD §3.2 P0 example format; duplicate consecutive labels collapsed per design decision (decide here).
- Notes: Decide now: do we show `C > B > C` or `C > B > C` (no collapse) when segments repeat? Document choice.

### P2-06: Section expandable panels (structure only, no pattern table yet)
- Status: TODO
- Difficulty: M
- Dependencies: P2-05
- Input: Section list
- Output: Collapsible panels per section; body empty or placeholder.
- Done criteria: Clicking section header expands/collapses smoothly.
- Notes: Pattern tables (Phase 3) will fill the body.

### P2-07: Regression smoke test (end-to-end with new UI)
- Status: TODO
- Difficulty: S
- Dependencies: P2-03, P2-05, P2-06
- Input: Same YouTube URL from P1-07
- Output: Screenshot or description showing the new layout working with real analysis output.
- Done criteria: No console errors, all fields populated from real data.

---

# Phase 3 — M3: Pattern Analysis (CORE CUSTOM WORK)

**Goal:** Section-wise chord progression tables with Scale Degree row. This is the single largest custom development effort in the project.
**Why it's split into many subtasks:** PRD §3.2 P1 defines the output format but not the algorithm. The algorithm has several non-trivial decisions (measure boundary determination, beat-slot mapping, sustain marker rules, repetition grouping). Getting any of these wrong makes the output unreadable.

### P3-01: Inventory chord recognition output shape
- Status: TODO
- Difficulty: S
- Dependencies: P1-07
- Input: Real chord recognition result from smoke test
- Output: Documented shape: `{chord_label, start_time, end_time, confidence?}[]`
- Done criteria: Sample printed here in DTL for reference.

### P3-02: Inventory beat / downbeat output shape
- Status: TODO
- Difficulty: S
- Dependencies: P1-07
- Input: Real beat tracking output
- Output: Documented shape: `{time, beat_index, is_downbeat}[]` (or equivalent)
- Done criteria: Sample printed here.

### P3-03: Design measure-boundary algorithm
- Status: TODO
- Difficulty: L
- Dependencies: P3-01, P3-02
- Input: Beat/downbeat data, time signature
- Output: **Written algorithm spec** (pseudocode) that converts beat stream → list of measures, each with start/end time and beat count.
- Done criteria: Spec handles edge cases: (a) missing downbeats, (b) tempo drift, (c) time-signature changes (decide: support or ignore for MVP), (d) partial measures at section boundaries.
- Notes: This is a **design task**, not coding. User review before P3-04.

### P3-04: Implement measure-boundary algorithm
- Status: TODO
- Difficulty: L
- Dependencies: P3-03
- Input: Approved spec
- Output: Pure function `buildMeasures(beats, downbeats, timeSig) → Measure[]`
- Done criteria: Unit tests cover normal case + each edge case from P3-03.
- Notes: Keep it a pure function so we can unit-test without the ML pipeline.

### P3-05: Design chord-to-beat-slot placement rules
- Status: TODO
- Difficulty: L
- Dependencies: P3-03, P3-01
- Input: Chord events (time-based), measure list (from P3-04)
- Output: **Written spec** for: (a) which beat slot a chord lands in, (b) when to write `-` (sustain), (c) how to handle chord changes mid-beat (round to nearest? quantize?), (d) how to represent multi-chord beats like `Eb-G-`.
- Done criteria: Spec produces the exact format shown in PRD §3.2 P1 example for a hand-constructed test case.
- Notes: The PRD example `Eb---,  Eb-G-` suggests comma-separated beats 3 and 4 with the second beat containing two chords. This formatting is non-trivial — be precise.

### P3-06: Implement chord placement
- Status: TODO
- Difficulty: L
- Dependencies: P3-05, P3-04
- Input: Approved spec
- Output: Pure function `placeChordsInMeasures(measures, chords) → MeasureWithSlots[]`
- Done criteria: Unit tests including the PRD example reproduced exactly.

### P3-07: Scale Degree computation
- Status: TODO
- Difficulty: M
- Dependencies: P3-06
- Input: Detected key (e.g. "Bb major"), chord labels (e.g. "Bb", "D", "Eb")
- Output: Pure function `chordRootToDegree(chord, key) → 1..7 | null`
- Done criteria: Unit tests cover: major keys (primary), minor keys (secondary), enharmonic equivalents (Eb vs D#), chords with extensions (Bb7, Dm7), chords outside the diatonic scale (return null or flag).
- Notes: PRD §5.2 gives the Bb major example. Implement a general-purpose key→scale table first, then lookup.

### P3-08: Pattern Table data structure
- Status: TODO
- Difficulty: M
- Dependencies: P3-06, P3-07
- Input: Measures-with-slots, key
- Output: `SectionPattern[]` shape feeding the UI.
- Done criteria: Schema documented here in DTL.

### P3-09: Repetition grouping (optional optimization)
- Status: TODO
- Difficulty: L
- Dependencies: P3-08
- Input: SectionPattern
- Output: Grouped view that collapses repeated chord progressions into fewer rows.
- Done criteria: Handmade repetitive example collapses correctly; non-repetitive example unchanged.
- Notes: PRD §5.3 bullet 6 asks for this. **Can be deferred** to post-MVP if schedule tight — flag to user.

### P3-10: Pattern Table UI component
- Status: TODO
- Difficulty: L
- Dependencies: P3-08
- Input: SectionPattern data
- Output: React table component with chord row + Scale Degree row beneath.
- Done criteria: Matches PRD §3.2 P1 visual example.

### P3-11: Integrate Pattern Tables into section panels
- Status: TODO
- Difficulty: S
- Dependencies: P3-10, P2-06
- Input: Section panels (from P2-06)
- Output: Each panel now renders its pattern table when expanded.
- Done criteria: End-to-end from real YouTube URL → visible pattern tables per section.

### P3-12: Phase 3 end-to-end validation
- Status: TODO
- Difficulty: M
- Dependencies: P3-11
- Input: 3 diverse test YouTube URLs (different keys, different time signatures)
- Output: Screenshots or exported JSON per URL.
- Done criteria: Human review confirms tables are musically sensible. Known inaccuracies documented.
- Notes: This is the go/no-go gate for Phase 4.

---

# Phase 4 — M4: Download Features

**Goal:** Export analysis as `.md`, `.png`, `.pdf`.

### P4-01: Markdown export
- Status: TODO
- Difficulty: M
- Dependencies: P3-12
- Input: Current analysis result in memory
- Output: Pure function `toMarkdown(result) → string`; download button wired.
- Done criteria: Downloaded `.md` renders correctly on GitHub preview.
- Notes: Keep tables ASCII-simple so other markdown renderers also handle it.

### P4-02: PNG export
- Status: TODO
- Difficulty: M
- Dependencies: P3-12
- Input: Result DOM node
- Output: PNG download via `html2canvas` (or equivalent).
- Done criteria: Downloaded PNG is readable, fonts render, tables not clipped.
- Notes: Watch for CORS issues with YouTube thumbnails.

### P4-03: PDF export
- Status: TODO
- Difficulty: L
- Dependencies: P4-02
- Input: Result DOM
- Output: PDF via `jsPDF` (frontend) or Puppeteer (backend).
- Done criteria: Multi-page PDF if section list is long; no clipping.
- Notes: Decide frontend (`jsPDF`) vs backend (Puppeteer). Frontend is simpler but lower quality. Document choice.

### P4-04: Download buttons UI placement
- Status: TODO
- Difficulty: S
- Dependencies: P4-01, P4-02, P4-03
- Input: Result page
- Output: Three buttons placed per PRD §4.2 ("top-right").
- Done criteria: Visible and functional.

---

# Phase 5 — M5: Auth + Deployment

**Goal:** Deployed, password-gated instance on AWS EC2.

### P5-01: Implement shared-password auth (PRD Option A)
- Status: TODO
- Difficulty: M
- Dependencies: P4-04
- Input: Frontend + backend
- Output: Any page requires a password; password stored in env var.
- Done criteria: Wrong password blocks access; correct password persists via cookie/session.
- Notes: This is deliberately minimal. Do NOT build a user system. PRD §5.4 Option A is explicit.

### P5-02: Dockerize backend
- Status: TODO
- Difficulty: M
- Dependencies: P1-07
- Input: Backend directory, requirements
- Output: Working `Dockerfile` for backend; image builds.
- Done criteria: `docker run` brings up backend; health check responds.
- Notes: Upstream may already have a Dockerfile — adapt rather than rewrite.

### P5-03: Dockerize frontend
- Status: TODO
- Difficulty: M
- Dependencies: P1-07
- Input: Frontend directory
- Output: Working `Dockerfile`; image builds.
- Done criteria: Container serves the built Next.js app.

### P5-04: docker-compose orchestration
- Status: TODO
- Difficulty: M
- Dependencies: P5-02, P5-03
- Input: Two Dockerfiles
- Output: `docker-compose.yml` running both; networking works.
- Done criteria: `docker compose up` produces a working app locally.

### P5-05: Provision EC2 + deploy
- Status: TODO
- Difficulty: L
- Dependencies: P5-04, P0-04 (sizing)
- Input: AWS account, EC2 instance tier decision
- Output: Public URL (with password gate).
- Done criteria: Remote smoke test from another machine passes.
- Notes: **User confirmation required before incurring AWS cost.**

### P5-06: Firebase Firestore caching
- Status: TODO
- Difficulty: M
- Dependencies: P5-05
- Input: Analysis endpoint
- Output: Results keyed by YouTube video ID; cache-hit path skips re-analysis.
- Done criteria: Second request for same URL returns in <1 s; logs show cache hit.
- Notes: PRD §7 lists this as a CPU-speed mitigation. May be moved earlier if CPU is a pain point.

---

# Phase 6 — M6: Stabilization

**Goal:** MVP shippable to friend group.

### P6-01: Test pass on 10 diverse YouTube URLs
- Status: TODO
- Difficulty: M
- Dependencies: P5-05
- Input: Curated URL list covering different genres, tempos, keys
- Output: Spreadsheet or markdown table of accuracy observations.
- Done criteria: Known failure modes documented; nothing crashes.

### P6-02: Bug triage + fixes
- Status: TODO
- Difficulty: L
- Dependencies: P6-01
- Input: Bug list from P6-01
- Output: Fixes committed.
- Done criteria: All P0/P1 bugs closed; P2+ bugs documented as known issues.

### P6-03: Friend-group soft launch & feedback
- Status: TODO
- Difficulty: M
- Dependencies: P6-02
- Input: Deployed URL + password
- Output: Feedback collected in a single document.
- Done criteria: User decides whether to ship, iterate, or pivot.

### P6-04: Post-MVP backlog
- Status: TODO
- Difficulty: S
- Dependencies: P6-03
- Input: Feedback
- Output: Append post-MVP section to this DTL with prioritized items.
- Done criteria: Backlog exists, ready for next planning round.

---

# Cross-cutting concerns (apply to all phases)

### C-01: Keep upstream merge path clean
- Before editing any upstream file, check whether the change can be made via configuration, subclassing, or a separate module instead of an in-place edit.
- Keep a running list in DTL appendix B of every upstream file we modified, with a one-line "why".

### C-02: Never commit secrets
- `.env`, Firebase credentials, EC2 keys → `.gitignore` + `settings.json` deny rules already cover `.env*` and `secrets/**`.

### C-03: Cache expensive ML results during development
- Once a smoke-test URL works, save its raw pipeline output to a JSON fixture so UI work doesn't require re-running the ML pipeline every iteration.

### C-04: Document every non-obvious decision inline in this DTL
- Algorithm choices (P3-03, P3-05), PDF generation strategy (P4-03), EC2 sizing (P5-05), etc. — write the decision in the task's Notes field.

---

# Appendices (to be filled during Phase 0)

## Appendix A.1 — ChordMiniApp overview
*(Fill during P0-01)*

## Appendix A.2 — Gap matrix
*(Fill during P0-02)*

## Appendix A.3 — Customization touchpoints
*(Fill during P0-03)*

## Appendix B — Upstream files modified
*(Running log, updated throughout all phases)*

---

*End of DTL v0.1 — awaiting user review.*
