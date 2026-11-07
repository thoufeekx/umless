---
name: umless
description: Clean up talking-head videos, screen recordings, podcasts and voice-overs by cutting filler words (um, uh), stutters, retakes/false starts and long silences with Umless. Use when the user asks to remove ums or filler words, cut silences or dead air, tighten a take, clean up a recording or demo video, or wants an Um Score / list of where they stumbled.
---

# Umless: cut ums, stutters, retakes and dead air

Umless transcribes a local video or audio file (through OpenRouter), marks filler words, repeated phrases, retakes and long pauses, and renders a tighter copy with ffmpeg. The original file is never modified. Video comes out as `<name>.umless.mp4`, audio as `<name>.umless.m4a`.

## Before you start

1. `ffmpeg -version` must work (6.1+). If missing: macOS `brew install ffmpeg`, Ubuntu/Debian `sudo apt install ffmpeg`, Windows `winget install ffmpeg`.
2. `OPENROUTER_API_KEY` must be set in the environment (https://openrouter.ai/keys). About $0.02 per 3 minutes of audio. Never print the key. If it is not set, ask the user to export it; do not ask them to paste it into the chat.
3. Node 20+.

## Preferred: the MCP tools

If the `umless` MCP server is connected (tools `analyze_video` and `clean_video`), use it:

- `analyze_video({ path })` returns the cut list without rendering: `cuts[]` (each with `start`, `end`, `type` = filler | repeat | retake | silence, `text`, `reason`), `keep[]` segments, `score` (Um Score 0-100), `counts`, `durationBefore`, `durationAfter`.
- `clean_video({ path, out?, options?: { retakes?, studio_sound? } })` renders and returns `output`, `durationBefore`, `durationAfter`, `savedSec`, `savedPct`, `counts` and the full `cutList`.

Pass absolute paths. Rendering takes roughly 30-60 s per minute of footage.

## Fallback: the CLI

```bash
npx -y github:thoufeekx/umless input.mp4            # writes input.umless.mp4
npx -y github:thoufeekx/umless input.mp4 --score    # Um Score + struck-through transcript, no render
```

From a clone: `npx tsx cli/umless.ts input.mp4`.

## Workflow

1. If the user only wants to know how bad a take is, or wants to review cuts first, run `analyze_video` (or `--score`) and summarise: Um Score, number of fillers / stutters / retakes, seconds of dead air, and the before -> after length. Quote a few cuts with timestamps (mm:ss) and reasons.
2. To clean, run `clean_video` (or the CLI). Report the output path, before -> after duration and what was cut.
3. For several files, process them one at a time and give a short table at the end.
4. Add `studio_sound: true` only if the user asks for cleaner/louder/denoised audio.

## Notes

- Retakes ("let me say that again", abandoned sentences) are found by an LLM; set `retakes: false` for a rules-only pass (fillers, repeats, pauses).
- Long pauses are shortened to about 0.25 s, not removed entirely, so speech still sounds natural.
- If a cut is wrong, the user can report it at https://github.com/thoufeekx/umless/issues with the struck-through transcript from `--score`.
- Re-voicing a script in the user's own voice is part of the hosted app (https://umless.thoufeekxlabs.com), not this tool.

## Install this skill

- Claude Code plugin: `/plugin marketplace add thoufeekx/umless` then `/plugin install umless@umless` (adds this skill and the MCP server).
- Skill only: `mkdir -p ~/.claude/skills/umless && curl -fsSL https://raw.githubusercontent.com/thoufeekx/umless/main/skills/umless/SKILL.md -o ~/.claude/skills/umless/SKILL.md`
