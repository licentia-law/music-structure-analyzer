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
- Status: DONE
- Difficulty: S
- Dependencies: none
- Input: github.com/ptnghia-j/ChordMiniApp
- Output: Short notes in DTL appendix A.1 — "ChordMiniApp overview"
- Done criteria: Can answer: directory layout? entry points? which services run where? license/attribution requirements?
- Notes: Do NOT clone yet. Read via web first to keep disk clean. → Completed 2026-04-10. See Appendix A.1.

### P0-02: Map existing features → PRD requirements
- Status: DONE
- Difficulty: M
- Dependencies: P0-01
- Input: ChordMiniApp feature list, PRD §3
- Output: Gap matrix in DTL appendix A.2 — columns: `PRD feature | Upstream status (have/partial/none) | Customization strategy`
- Done criteria: Every PRD P0/P1 feature has a row. "Partial" rows state exactly what is missing.
- Notes: Completed 2026-04-10. See Appendix A.2. Key finding: core ML pipeline ~70% ready; all download features and Pattern Table are `none`; required libraries (html2canvas, jspdf) are already in package.json.

### P0-03: Identify customization touchpoints
- Status: DONE
- Difficulty: M
- Dependencies: P0-02
- Input: Gap matrix
- Output: DTL appendix A.3 — list of upstream files/modules we expect to modify, grouped by concern (UI, chord post-processing, routing, etc.)
- Done criteria: Each file has a one-line "why" and expected edit size (small/medium/rewrite).
- Notes: Completed 2026-04-10. See Appendix A.3. 4 upstream files to modify; ~10 new files to create. Largest risk: Pattern Table is full new development.

### P0-04: Verify ML model availability & CPU feasibility
- Status: DONE
- Difficulty: M
- Dependencies: P0-01
- Input: ChordMiniApp model list (SongFormer, Beat-Transformer, Chord-CNN-LSTM, BTC)
- Output: Notes on (a) model weights download path, (b) approximate runtime on CPU for a 3-min track, (c) memory footprint
- Done criteria: Confirmed each model can run on the target EC2 tier; or flagged as a risk with mitigation.
- Notes: Completed 2026-04-10. See P0-04 Notes below.
  **[Updated P0-01]** ChordMiniApp has TWO separate Python services with conflicting torch versions:
  - `python_backend/`: torch 2.6.0, tensorflow 2.15.1, madmom — Beat-Transformer, Chord-CNN-LSTM, BTC
  - `SongFormer/`: torch 2.2.2, transformers 4.51.1 — SongFormer inference only
  CPU feasibility must be verified for **both services independently**. Memory footprint estimate must account for both running simultaneously on the same EC2 instance.

  **P0-04 Notes (CPU Feasibility):**

  *(a) Model weight download paths:*
  - Beat-Transformer, Chord-CNN-LSTM, BTC: Git submodules in `python_backend/models/`; weights downloaded at runtime (deferred loading on first request).
  - SongFormer: loaded via HuggingFace `from_pretrained()` at runtime (HuggingFace Hub: ASLP-lab/SongFormer).
  - Spleeter 5-stems (~200 MB): pre-downloaded during Docker build.
  - No weights are bundled in the repo; all fetched on first request or build.

  *(b) Approximate CPU runtime for a 3-minute track:*
  > ⚠ 아래 수치는 논문/벤치마크 extrapolation 추정값이며, 실제 측정값이 아님. **P1-07 smoke test에서 실측 후 이 표를 업데이트할 것.**

  | Component | 추정 CPU time | 근거 |
  |-----------|-------------|------|
  | Spleeter (source separation) | 30–60 s | Deezer 공개 벤치마크 |
  | Beat-Transformer | 60–180 s | ISMIR 2022 논문 + transformer 복잡도 추정 |
  | Chord-CNN-LSTM / BTC | 5–15 s | CNN-LSTM 일반 벤치마크 |
  | SongFormer | 10–30 s | 논문 "blazing fast inference" 언급 + 4-layer 소형 모델 |
  | madmom RNNBeatProcessor | 5–20 s | RNN 일반 벤치마크 |
  | **Total (sequential, both backends)** | **~2–5 minutes** | 상단 합산 |

  *(c) Memory footprint:*
  | Scenario | RAM required |
  |----------|-------------|
  | python_backend loaded | 2.0–2.5 GB |
  | SongFormer loaded | 1.5–2.0 GB |
  | Both + 1 request in flight | 3.0–4.0 GB |
  | Safe production (2× headroom) | **8–10 GB** |

  **EC2 Sizing Decision:**
  - **Recommended: t3.xlarge (4 vCPU / 16 GB, ~$121/month)** — provides memory headroom, burstable CPU suits periodic inference workload.
  - Fallback: c5.2xlarge (8 vCPU / 16 GB, ~$248/month) for more consistent latency.
  - t3.medium/t3.large are insufficient (4–8 GB RAM is too tight).
  - **Risk flag:** 2–5 min per track is tolerable only with async queue + Firebase cache (already planned).

### P0-05: Review upstream license & attribution obligations
- Status: DONE
- Difficulty: S
- Dependencies: P0-01
- Input: ChordMiniApp LICENSE file, third-party model licenses
- Output: Short compliance note — what attribution we must preserve, what we can rename/rebrand.
- Done criteria: Clear yes/no on: (1) can we close-source our fork? (2) what notices must appear in UI/README?
- Notes: Completed 2026-04-10. ChordMiniApp is MIT, so likely permissive. Models may have separate licenses.

  **P0-05 Output (License Audit):**

  | Model / Library | License | Commercial OK? | Private service OK? | Attribution needed? |
  |-----------------|---------|---------------|--------------------|--------------------|
  | ChordMiniApp (app code) | MIT | Yes | Yes | Yes — include MIT notice in repo |
  | SongFormer | CC BY 4.0 | Yes | Yes | Yes — credit ASLP-lab/SJTU |
  | Beat-Transformer | MIT | Yes | Yes | Yes — MIT notice |
  | BTC (chord recognition) | MIT | Yes | Yes | Yes — MIT notice |
  | Chord-CNN-LSTM | **Unknown** (likely MIT via ChordMiniApp) | ? | ? | Verify before launch |
  | madmom (models) | **CC-BY-NC-SA 4.0** | **NO** | Yes (zero-revenue) | Yes — credit CPJKU/Widmer |
  | MuQ weights (SSL features) | **CC-BY-NC 4.0** | **NO** | Yes (zero-revenue) | Yes — credit Tencent AI Lab |
  | MusicFM (SSL alternative) | MIT + Apache 2.0 | Yes | Yes | Yes |
  | librosa | ISC | Yes | Yes | No |
  | yt-dlp | Unlicense | Yes | Yes | No |

  **Key compliance answers:**
  1. **Can we close-source our fork?** YES — app code is MIT; model weights remain under their original licenses.
  2. **Can we use these models for a private friend-group service?** YES — as long as zero revenue. madmom (CC-BY-NC-SA) and MuQ (CC-BY-NC) block any monetization.
  3. **What notices must appear?** An "Open Source Credits" section in README crediting ChordMiniApp, SongFormer, Beat-Transformer, BTC, madmom, MuQ.
  4. **Any research-only models?** madmom (CC-BY-NC-SA) and MuQ weights (CC-BY-NC) are non-commercial. Fine for zero-revenue friend group use. If monetization planned: replace madmom with librosa, MuQ with MusicFM.
  5. **Risk flag:** Chord-CNN-LSTM license unknown — verify during P1-04 when inspecting the actual submodule.

### P0-06: Decide Phase 1 entry conditions
- Status: IN PROGRESS
- Difficulty: S
- Dependencies: P0-02, P0-03, P0-04, P0-05
- Input: All Phase 0 outputs
- Output: Go/No-Go decision, recorded as a short note at the top of Phase 1.
- Done criteria: User has reviewed Phase 0 findings and approved fork execution.
- Notes: Draft Go/No-Go below — **awaiting user review**.

  **Phase 0 Summary & Go/No-Go Draft:**

  | Area | Finding | Risk level |
  |------|---------|------------|
  | Upstream reuse | Core ML pipeline ~70–80% ready (BPM, chord, song structure, beats) | Low |
  | Gap — Pattern Table | Pattern Table + Scale Degree: 100% new development (~3–4 weeks) | Medium |
  | Gap — Downloads | All 3 formats: 0% upstream; BUT all required npm libs (html2canvas, jspdf) already in package.json | Low |
  | Gap — Auth | No upstream auth; simple env-var password is ~1 day work | Low |
  | CPU feasibility | 2–5 min/track; within tolerance with async + Firebase cache | Medium |
  | License | App code MIT-clean; models are non-commercial acceptable for friend group | Low |
  | Layout mismatch | ChordMiniApp has no frontend/ subdir — P1-02 must resolve integration layout | Low |
  | Chord-CNN-LSTM license | Unknown — verify in P1-04 | Low (likely MIT) |

  **Preliminary recommendation: GO (fork & customize)**
  - The fork provides substantial acceleration (60–70% of pipeline already works).
  - All download library dependencies are pre-installed in package.json.
  - Pattern Table is the largest unknown but is architecturally independent (pure frontend + pure-function algorithm).
  - No blocking license issues for the target use case (private, non-commercial).

  **→ User action required: Approve or request changes before P1-01 begins.**

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
  **[Updated P0-01]** ChordMiniApp puts Next.js at the **repo root** (no `frontend/` subdirectory).
  CLAUDE.md §4 layout plan (`frontend/`, `backend/`) does not match upstream structure.
  This decision must explicitly resolve: do we adopt upstream's root-level layout, or restructure into subdirs?

### P1-03: Integrate fork into repository
- Status: TODO
- Difficulty: M
- Dependencies: P1-02
- Input: Decision from P1-02
- Output: Fork code present in this repository; `upstream` remote configured.
- Done criteria: `git log` shows fork history; `git remote -v` shows both `origin` (ours) and `upstream` (ChordMiniApp).
- Notes: Be very careful not to overwrite `docs/PRD.md`, `docs/DTL.md`, `CLAUDE.md`.

### P1-04: Install backend Python environments
- Status: TODO
- Difficulty: M
- Dependencies: P1-03
- Input: `python_backend/requirements.txt`, `SongFormer/requirements.txt`
- Output: Two working `.venv` environments, one per service.
- Done criteria: Each service passes `python -c "import torch; import flask"` in its own venv; `pip list` matches respective `requirements.txt`.
- Notes: **[Updated P0-01]** TWO separate venvs required — torch versions conflict (2.6.0 vs 2.2.2), cannot share one env.
  - `python_backend/.venv` — Python 3.10.x, torch 2.6.0, tensorflow 2.15.1, madmom
  - `SongFormer/.venv` — Python **3.10.16** (pinned in `.python-version`), torch 2.2.2, transformers 4.51.1
  Use `python -m venv .venv` inside each directory. Never install globally.

### P1-05: Install frontend Node environment
- Status: TODO
- Difficulty: S
- Dependencies: P1-03
- Input: Repo root `package.json` (Next.js is at repo root, not in `frontend/`)
- Output: `node_modules` installed; dev server starts.
- Done criteria: `npm run dev` brings up a local page without console errors.
- Notes: **[Updated P0-01]** Package manager is **npm** (confirmed — `package-lock.json`, `.npmrc`, README). Node.js 20 recommended (matches production Dockerfile `node:20-alpine`). Run `npm install` at repo root.

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
*(Filled 2026-04-10, P0-01 DONE)*

### A.1.1 Directory Layout

The repo root **is** the Next.js frontend (not a `frontend/` subdirectory).
Two separate Python backends coexist under the root.

```
ChordMiniApp/                        ← Next.js app root
├── Dockerfile                       ← Frontend production image (node:20-alpine)
├── docker-compose.prod.yml          ← Production stack
├── package.json                     ← Frontend deps (npm)
├── .env.example                     ← All env vars documented
├── .gitmodules                      ← Git submodules present
├── .firebaserc
├── LICENSE                          ← MIT, Copyright 2025 ChordMini Project
├── README.md
├── CONTRIBUTING.md
│
├── src/                             ← Next.js App Router source
│   └── app/                         ← Pages, components, API routes
│
├── public/                          ← Static assets
│
├── python_backend/                  ← Main ML Flask backend
│   ├── app.py                       ← Entry point
│   ├── app_factory.py               ← create_app(), blueprint registration
│   ├── requirements.txt
│   └── [blueprints: beats, chords, lyrics, youtube, audio, health, debug, docs]
│
├── SongFormer/                      ← Separate SongFormer inference service
│   ├── app.py                       ← Flask app entry point
│   ├── sequential_inference.py
│   ├── requirements.txt
│   ├── .python-version              ← pins 3.10.16
│   ├── Dockerfile
│   └── src/
│       ├── SongFormer/              ← model, configs, checkpoints
│       └── data_pipeline/           ← SSL feature extraction (MuQ, MusicFM)
│
└── sheetsage/                       ← Experimental melody transcription (Docker only)
```

**Impact on our fork layout:**
Our `CLAUDE.md` §4 shows `frontend/` and `backend/` as separate dirs — but ChordMiniApp puts Next.js at the root. We must revisit the integration layout decision in P1-02.

---

### A.1.2 Entry Points

| Component | File | Dev command | Default port |
|-----------|------|-------------|--------------|
| Frontend (Next.js) | `src/app/` | `npm run dev` | 3000 |
| Main Python backend | `python_backend/app.py` | `python app.py` | **5001** |
| SongFormer service | `SongFormer/app.py` | `python app.py` | **8080** |
| Sheet Sage (experimental) | `sheetsage/` | Docker only | 8082 |

Note: Backend uses port **5001** (not 5000) to avoid conflict with macOS AirPlay.

---

### A.1.3 Services — Where They Run

| Service | Technology | Port (dev) | Port (prod Docker) |
|---------|-----------|------------|--------------------|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS | 3000 | 3000 |
| Main backend | Flask 3.0.3 + gunicorn 21.2.0 | 5001 | 8080 |
| SongFormer service | Flask 3.1.0 + gunicorn 23.0.0 | 8080 | 8080 |

**ML pipeline components (all in `python_backend/`):**
- Beat/BPM: Beat-Transformer + madmom + DBN
- Chord recognition: Chord-CNN-LSTM + BTC
- Song structure: SongFormer (via separate service at `SONGFORMER_API_URL`)
- Audio extraction: yt-dlp (primary), yt-mp3-go (fallback)
- Chord correction: Google Gemini API
- Source separation: Spleeter

**Key env vars:**
- `PYTHON_API_URL` → main backend URL (default `http://localhost:5001`)
- `SONGFORMER_API_URL` → SongFormer URL (default `http://localhost:8080`)
- `NEXT_PUBLIC_FIREBASE_*` (6 vars), `NEXT_PUBLIC_GEMINI_API_KEY`, `NEXT_PUBLIC_YOUTUBE_API_KEY`

**Python version:** `SongFormer/.python-version` pins **3.10.16**. Both services must use Python 3.10.x. `python_backend` has 3.10 compat shims for numpy/collections deprecations.

**Conflicting torch versions:** `python_backend` uses torch 2.6.0; `SongFormer` uses torch 2.2.2. They **must run in separate `.venv` environments** — they cannot share one.

**Package manager:** **npm** (confirmed by `package.json`, `.npmrc`, `node:20-alpine` in Dockerfile, README: "Node.js 18+ with npm"). No pnpm.

**Production Docker (`docker-compose.prod.yml`):**
- `chordmini-frontend` (port 3000) + `chordmini-backend` (port 8080) on `chordmini-network`
- Volume `backend-cache` → `/tmp/model_cache` for ML model caching
- Health check: `GET /api/health` every 30 s

---

### A.1.4 License & Attribution

**License:** MIT, Copyright (c) 2025 ChordMini Project.

| Question | Answer |
|----------|--------|
| Can we close-source our fork? | **Yes** — MIT permits proprietary derivatives |
| Must we publish our changes? | **No** — MIT has no copyleft obligation |
| What notices must appear? | Include `Copyright (c) 2025 ChordMini Project` + MIT License text somewhere in the repo (e.g., `NOTICE` or alongside our own `LICENSE`). No UI attribution required by the license, but good practice. |
| Can we rename/rebrand? | **Yes** — MIT does not restrict naming |
| Third-party model licenses | Verify separately in P0-05: SongFormer, Beat-Transformer, Chord-CNN-LSTM, BTC may have their own academic/research-use licenses. |

**Action for P0-05:** Audit model-level licenses (SongFormer, Beat-Transformer, BTC, Chord-CNN-LSTM checkpoints). The app framework is MIT-clean; the ML weights may differ.

---

### A.1.5 Key Dependency Versions (for P1-04 / P1-05 planning)

**Frontend (npm):** Next.js 16, React 19, TypeScript 5, Tailwind CSS, Firebase SDK, Zustand, Axios, Framer Motion, `@google/generative-ai`, `@tombatossals/react-chords`, `ytdl-core`.

**`python_backend/requirements.txt` highlights:**
```
numpy==1.26.4
flask==3.0.3  /  gunicorn==21.2.0
librosa==0.10.1
tensorflow==2.15.1       # Chord-CNN-LSTM
torch==2.6.0             # Beat-Transformer
spleeter==2.3.2
yt-dlp==2025.4.30
madmom>=0.16.1
scipy==1.13.1
```

**`SongFormer/requirements.txt` highlights:**
```
torch==2.2.2  /  torchaudio==2.2.2   # ← different from python_backend!
transformers==4.51.1
huggingface-hub==0.30.1
librosa==0.11.0
flask==3.1.0  /  gunicorn==23.0.0
omegaconf==2.3.0
einops==0.8.1
x-transformers==2.4.14
```

## Appendix A.2 — Gap matrix
*(Filled 2026-04-10, P0-02 DONE)*

Legend: `have` = fully implemented upstream · `partial` = exists but needs work · `none` = not present

### Core Pipeline Features (PRD §3.1–3.2 explicit P0)

| # | Feature | PRD Ref | Upstream status | What is missing / what to do |
|---|---------|---------|-----------------|------------------------------|
| 1 | YouTube URL input + validation | §3.1 | `have` | URL validation + search via YouTube API already implemented. Minor UI restyling may be needed. |
| 2 | Audio extraction (yt-dlp → WAV) | §3.1 | `partial` | yt-dlp extraction exists (`src/app/api/extract-audio`). Fallback yt-mp3-go also present. WAV conversion is abstracted — verify format selection produces WAV output specifically during P1-07 smoke test. |
| 3 | Key / Scale detection | §3.2 P0 | `partial` | Key detection exists but ChordMiniApp uses **Gemini API** (`src/app/api/detect-key`), not librosa Krumhansl-Schmuckler. Returns key name; does NOT return scale table. **Two actions:** (A) Confirm python_backend librosa K-S path exists or add it; (B) Build scale table generator (Bb=1, C=2 …) from key name — entirely new UI logic. |
| 4 | BPM detection | §3.2 P0 | `have` | Beat-Transformer in `python_backend/models/`; BPM endpoint in beats blueprint. No changes needed. |
| 5 | Time Signature detection | §3.2 P0 | `partial` | Beat-Transformer provides beat positions and downbeats. Time-signature inference from beat/downbeat spacing is **not confirmed** in source. **Action:** Implement meter detection (madmom meter or custom heuristic) and surface it as a response field. |
| 6 | Song Form analysis (SongFormer) | §3.2 P0 | `partial` | SongFormer runs as a **separate service** (port 8080); python_backend calls it via `SONGFORMER_API_URL`. Segmentation boundaries and raw labels are returned. **Missing:** (A) Label → abbreviation mapping (I/V/PC/C/B/Inst/O) — **to be implemented as frontend post-processing** (`src/lib/songFormLabelMapper.ts`); (B) Pre-Chorus heuristic (short segment between V and C) — same frontend layer. ⚠ No `python_backend/blueprints/songformer.py` exists per A.1.1; verify exact call path in P1-07. |
| 7 | Analysis result page (Song Info Card) | §4.2 | `partial` | `src/app/analyze/[videoId]/page.tsx` (57 KB) has BPM, key, chord display. **Missing in UI:** scale table row (Bb=1 …), time signature display, Song Form one-line summary with abbreviations. Card layout needs redesign. |
| 18 | Chord recognition (CNN-LSTM / BTC) | §5.1 | `have` | Chord-CNN-LSTM + BTC both available in `python_backend/models/` (git submodules). Chord timestamps returned by chords blueprint. Used as input to Pattern Table — no upstream changes needed for core recognition. |
| 19 | Source separation (Spleeter) | §5.1 | `have` | Spleeter 5-stems pre-downloaded in Docker build. Used internally to improve chord/beat accuracy. No API surface change needed. |
| 20 | Chord correction (Gemini API) | §7 | `have` | Gemini API correction already integrated (PRD §7 risk mitigation). No changes needed unless accuracy is unsatisfactory. |

### Customization & Extras (PRD §3.2 P1, §3.3, §4–5)

| # | Feature | PRD Ref | Upstream status | What is missing / what to do |
|---|---------|---------|-----------------|------------------------------|
| 8 | Pattern Table UI | §3.2 P1 | `none` | **Core custom feature. 100% new.** ChordMiniApp has `ChordGrid.tsx` / `ChordCell.tsx` for chord display, but NOT the beat-slot table format (e.g. `Bb---`, `Eb-G-`). Requires: (A) measure-boundary algorithm (Phase 3), (B) chord-to-beat-slot placement, (C) new React table component with chord row + Scale Degree row. |
| 9 | Scale Degree auto-calculation | §5.2 | `none` | **New pure function.** Key detection exists; chord detection exists; but mapping chord root → 1–7 is not implemented. ~50 lines. Handle enharmonics (C#↔Db) and chromatic chords (return null or flag). |
| 10 | Repeat grouping in pattern tables | §5.3 | `none` | **New algorithm.** Detect consecutive identical chord patterns, group as "×N" rows. Can be deferred post-MVP (flag to user at P3-09). |
| 11 | Download as .md | §3.3 | `none` | **New.** `react-markdown` already in package.json. Build `toMarkdown(result)` serializer + browser download trigger. ~100 lines. |
| 12 | Download as .png | §3.3 | `none` | **New.** `html2canvas ^1.4.1` already in package.json. Wire to result container + download. ~50 lines. CORS risk with YouTube thumbnails — use `useCORS: false` or exclude thumbnail. |
| 13 | Download as .pdf | §3.3 | `none` | **New.** `jspdf ^4.2.1` already in package.json. Use frontend jsPDF (simpler, no Puppeteer needed). ~150 lines. Multi-page support needed for long section lists. |
| 14 | Simple shared-password auth | §5.4 | `none` | **New.** No auth in upstream. Implement env-var password check in Next.js middleware (`middleware.ts`). Store session in cookie. ~100 lines frontend. |
| 15 | YouTube embed player | §3.3 | `partial` | `CollapsibleVideoPlayer.tsx` (13.7 KB) and `FloatingVideoDock.tsx` (14.4 KB) exist. Integration into result page needs verification during P2-01. |
| 16 | Progress indicator | §4.1 | `have` | `ProgressBar.tsx`, `ProcessingStatusBanner.tsx`, `ProcessingBanners.tsx` all present. Wire-up check during P1-07. |
| 17 | Recent analyses list (Firebase) | §4.1 | `partial` | Firebase Firestore used for caching transcriptions/keys/segmentation. Infrastructure exists. **Missing:** UI component on homepage displaying recent analyses. |

### Summary

| Category | Count |
|----------|-------|
| `have` — no work needed | 5 (BPM, Chord recognition, Spleeter, Gemini correction, Progress indicator) |
| `partial` — upstream logic exists, customization needed | 8 |
| `none` — new development | 7 |
| **Total features** | **20** |

**Installed but unused npm libs (ready to wire):** `html2canvas`, `jspdf`, `react-markdown`.
**Largest gap:** Pattern Table (feature #8) — 100% new, drives Phase 3 (2–3 weeks estimated).

---

## Appendix A.3 — Customization touchpoints
*(Filled 2026-04-10, P0-03 DONE)*

Files are grouped by concern. "Edit size" = small (< 50 lines changed) · medium (50–200 lines) · rewrite (primary logic replaced).

### Group 1: Backend — Python

| File | Why we touch it | Edit size |
|------|-----------------|-----------|
| `python_backend/blueprints/beats.py` (or equivalent) | Surface time-signature field in beat response (madmom meter detection or downbeat-interval heuristic) | small–medium |

**⚠ Risk flags:**
- `python_backend/blueprints/songformer.py`는 A.1.1 blueprint 목록(`beats, chords, lyrics, youtube, audio, health, debug, docs`)에 **없음**. SongFormer는 독립 서비스(port 8080)로 작동하므로 레이블 매핑은 **프론트엔드에서 후처리**하는 것이 올바른 위치. P1-07에서 실제 호출 경로(Next.js → python_backend → SongFormer vs Next.js → SongFormer 직접) 확인 후 확정.
- Key detection이 Gemini API 전용인 경우, librosa K-S 결과를 노출하는 새 endpoint 추가 필요. 마찬가지로 P1-07에서 확인.

### Group 2: Frontend — Existing pages/components

| File | Why we touch it | Edit size |
|------|-----------------|-----------|
| `src/app/analyze/[videoId]/page.tsx` | Replace/extend Song Info Card section to show scale table, time sig, Song Form summary with abbreviations; add Pattern section stub | medium |
| `src/app/page.tsx` | Add Recent Analyses list component below URL input form | small |

### Group 3: Frontend — New files (100% new, not modifying upstream)

| New file | Purpose | Complexity |
|----------|---------|------------|
| `src/components/SongInfoCard.tsx` | Renders Key / Scale table / BPM / Time / Song Form summary card | medium |
| `src/components/PatternTable.tsx` | Beat-slot chord table with Scale Degree row per section | **rewrite** (largest single component) |
| `src/components/SectionPanel.tsx` | Collapsible panel per song section (wraps PatternTable) | medium |
| `src/lib/songFormLabelMapper.ts` | Pure function: SongFormer raw label → I/V/PC/C/B/Inst/O 매핑 + Pre-Chorus 휴리스틱. frontend 후처리 레이어 (Group 1의 songformer.py 가정 오류 대체). | small |
| `src/lib/scaleDegree.ts` | Pure function: `chordRootToDegree(chord, key) → 1..7 \| null` | small |
| `src/lib/measureBuilder.ts` | Pure function: `buildMeasures(beats, downbeats, timeSig) → Measure[]` | medium |
| `src/lib/chordPlacement.ts` | Pure function: `placeChordsInMeasures(measures, chords) → MeasureWithSlots[]` | medium |
| `src/lib/exportMarkdown.ts` | `toMarkdown(result) → string` + download trigger | small |
| `src/lib/exportPng.ts` | html2canvas capture + download trigger | small |
| `src/lib/exportPdf.ts` | jsPDF multi-page generation + download trigger | small–medium |
| `src/middleware.ts` | Next.js middleware for env-var password gate | small |

### Group 4: Configuration

| File | Why we touch it | Edit size |
|------|-----------------|-----------|
| `.env.example` | Add `AUTH_PASSWORD` env var entry | small |
| `docker-compose.prod.yml` | Add SongFormer service if not already separate; add `AUTH_PASSWORD` env var; resource limits for EC2 | small |

### Touchpoint risk summary

| Risk | Location | Mitigation |
|------|----------|------------|
| Key detection path (Gemini vs librosa) | `src/app/api/detect-key/` + `python_backend/` | Verify in P1-07; add librosa endpoint if needed |
| SongFormer 호출 경로 불확실 (Next.js → backend → SongFormer vs 직접 호출) | `python_backend/` vs `SongFormer/app.py` | P1-07에서 실제 request 경로 확인 후 레이블 매핑 위치 확정 |
| Chord-CNN-LSTM license unknown | `python_backend/models/` submodule | Inspect LICENSE in submodule during P1-04 |
| PatternTable is 100% new with complex algorithm | `src/components/PatternTable.tsx` + 4 lib files | Phase 3 is dedicated to this; design before code (P3-03, P3-05) |
| Pre-Chorus heuristic may break for some songs | `src/lib/songFormLabelMapper.ts` | Document exact rule; flag to user in P2-04 |

## Appendix B — Upstream files modified
*(Running log, updated throughout all phases)*

---

*End of DTL v0.1 — awaiting user review.*
