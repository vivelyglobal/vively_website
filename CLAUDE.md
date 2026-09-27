# Project Instructions

## Token efficiency — read this first
- Be concise. No preamble, no recaps, no restating my request back to me.
- Do NOT explain code you just wrote unless I ask. A one-line summary is enough.
- Read only the files needed for the task. Never scan the whole repo "for context".
- When reading large files, read the relevant section (offset/limit), not the entire file.
- Prefer Grep/Glob to locate code instead of opening many files one by one.
- Never re-read a file you already read this session unless it changed.
- Do not run builds, tests, or linters unless I ask or the task clearly requires it.
- When a command's output is long, filter it (grep, head, tail) instead of dumping it all.
- Don't create extra files I didn't ask for: no README, no examples, no demo scripts, no summary .md files.
- Don't add comments/docstrings to code unless I ask or the codebase convention requires it.
- Make the minimal change that solves the task. No drive-by refactors, renames, or "improvements".
- If a task is ambiguous, ask one short question instead of exploring the codebase to guess.
- Skip subagents/Task tool for simple lookups — search directly.

## Directories to ignore
Never read, search, or list: `node_modules/`, `dist/`, `build/`, `.next/`, `out/`,
`coverage/`, `.git/`, `*.lock`, `*.min.*`, generated files, and binary assets.

## Workflow
- Plan briefly before multi-file edits; for a single-file fix, just do it.
- Verify with the narrowest possible check (run the one affected test, not the suite).
- Stop when the task is done. Do not continue with optional follow-up work.

## Git
- NEVER run `git add`, `git commit`, or `git push` — I handle all git operations myself.
- Don't run `git status`/`git diff`/`git log` unless I explicitly ask about git state.
