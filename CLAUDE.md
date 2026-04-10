# CLAUDE.md — Music Structure Analyzer

This file provides persistent project context to Claude Code across sessions.
Read before starting any task in this repository.

---

## 1. Project Summary

**Music Structure Analyzer** — A web application that takes a YouTube URL as input and automatically analyzes the track's **Key, Scale, BPM, Time Signature, Song Form, and section-wise chord Pattern (with Scale Degrees)**, displays the results in the browser, and allows downloading as `.md`, `.png`, or `.pdf`.

- **Intended audience:** Small group of friends (private sharing, simple auth)
- **Development approach:** **Fork + customize** [ChordMiniApp](https://github.com/ptnghia-j/ChordMiniApp) (MIT License)
  - 70–80% of the core pipeline (YouTube audio extraction, key/BPM detection, chord recognition, SongFormer structure analysis) is already implemented in ChordMiniApp.
  - Our work focuses on **UI customization**, **Pattern table (custom logic)**, **Scale Degree auto-calculation**, **downloads**, **auth**, and **deployment**.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Backend | Python Flask |
| ML Pipeline | SongFormer, Beat-Transformer, Chord-CNN-LSTM, librosa, madmom |
| Infra | AWS EC2 (CPU-only) + Docker |
| DB/Cache/Auth | Firebase (Firestore + optional Anonymous Auth) |
| Audio extraction | yt-dlp |

---

## 3. Current Phase

**Phase 0 — Pre-investigation (no code yet).**

- `docs/PRD.md` exists (product spec, v1.0)
- `docs/DTL.md` exists (detailed task list — the execution document you should follow)
- No fork, no source code, no dependencies installed yet
- Next concrete step: **Phase 0 tasks in DTL.md** (ChordMiniApp structure analysis + customization point mapping)

**When the phase changes, update this section.**

---

## 4. Repository Layout (expected after M0)

```
music-structure-analyzer/
├── CLAUDE.md               ← this file
├── docs/
│   ├── PRD.md              ← product requirements (do not modify without user approval)
│   └── DTL.md              ← detailed task list (execution document — update as work progresses)
├── frontend/               ← Next.js app (after fork)
├── backend/                ← Python Flask app (after fork)
│   └── .venv/              ← Python virtual environment (local only, gitignored)
├── docker-compose.yml      ← (after fork)
└── .claude/
    └── settings.json       ← hooks + permissions (lives in main repo)
```

---

## 5. Working Rules

### 5.1 Base directory
- **All work output goes to the project base folder** (this worktree root, which merges back to `main`).
- Do not create files outside this directory tree.

### 5.2 Documents
- **`docs/PRD.md` is the product spec.** Treat it as a read-only reference unless the user explicitly asks to revise it.
- **`docs/DTL.md` is the execution document.** Update task status, add subtasks, and record decisions there as work progresses.
- Never duplicate content between PRD and DTL. PRD = "what", DTL = "how & progress".

### 5.3 Fork-based development discipline
- We are **customizing a fork**, not writing from scratch. Before adding new code, check whether ChordMiniApp already provides the feature.
- When modifying fork code, prefer minimal, surgical edits that stay close to upstream structure — this makes future upstream merges feasible.
- Document every customization point in `docs/DTL.md` under the relevant phase.

### 5.4 Environment setup policy
- **Python:** use a `.venv` inside `backend/` (not a global env).
- **Node.js:** use the package manager that ChordMiniApp uses (likely `npm` or `pnpm` — confirm at fork time).
- Never install dependencies globally.

### 5.5 Secrets
- API keys, Firebase credentials, and share passwords go into `.env` (gitignored).
- Never commit `.env` or credential files. `settings.json` denies reading `.env*` and `secrets/**`.

### 5.6 Korean / English
- User communication is in **Korean**.
- Code comments, commit messages, docs: **English by default**, Korean acceptable for user-facing UI strings.

---

## 6. Core Custom Features (NOT in upstream ChordMiniApp)

These four areas are the main development focus:

1. **Pattern Table UI** — section-wise chord progression as a 4-beat table with Scale Degree row beneath the chord row.
2. **Scale Degree auto-calculation** — map chord roots to 1–7 based on detected key.
3. **Download as `.md` / `.png` / `.pdf`** — frontend-driven export.
4. **Simple auth + EC2 deployment** — shared password (Option A from PRD §5.4) and Dockerized deployment.

See `docs/DTL.md` Phase 3–5 for task breakdown.

---

## 7. Known Risks (from PRD §7)

- **yt-dlp YouTube policy changes** — keep yt-dlp updated; have `yt-mp3-go` as fallback.
- **CPU-only ML speed** — cache analysis results in Firebase; async + progress UI.
- **Chord recognition accuracy** — use Gemini API correction (already in ChordMiniApp).
- **SongFormer segment errors** — manual correction UI is a post-MVP item.
- **Pre-Chorus not a SongFormer label** — heuristic mapping of short segments between verse/chorus.

---

## 8. Glossary Shortcuts

`I`=Intro, `V`=Verse, `PC`=Pre-Chorus, `C`=Chorus, `B`=Bridge, `Inst`=Interlude, `O`=Outro.
Full definitions in `docs/PRD.md` §8.
