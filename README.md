<p align="center"><img src="docs/demo.gif" alt="A 39-second first take with 9 ums, 6 stutters and a retake, cut by Umless to 17 seconds" width="720"></p>

# Umless

**Record once, post today.** Umless is an open-source command-line tool that cuts ums, stutters, retakes and dead air out of talking-head video and demo recordings. On our test take it turned **39.4 s into 17.5 s**: 9 ums, 6 stutters and one "let me say that again" removed, with no clicks at the cuts.

[Quick start](#quick-start) · [How it works](#how-it-works) · [Hosted version](https://umless.thoufeekxlabs.com/?ref=github) · [Report a bad cut](https://github.com/thoufeekx/umless/issues/new)

If Umless saves you an editing session, a ⭐ helps other people find it.

## Quick start

You need Node 20+, `ffmpeg` on your PATH and an [OpenRouter key](https://openrouter.ai/keys). A 3-minute video costs about $0.02 in API calls.

```bash
git clone https://github.com/thoufeekx/umless && cd umless && npm install
OPENROUTER_API_KEY=... npx tsx cli/umless.ts my-video.mp4          # writes my-video.umless.mp4
OPENROUTER_API_KEY=... npx tsx cli/umless.ts my-video.mp4 --score  # Um Score only, no render
OPENROUTER_API_KEY=... npx tsx cli/umless.ts my-video.mp4 --edl    # also writes my-video.umless.edl
```

The terminal prints an Um Score (ums per minute, stutters and retakes, seconds of dead air), your transcript with every cut word struck through, and the before/after length. Audio files work too and come out as `.m4a`.

## What it cuts

- **Filler words:** um, uh, er and similar. The transcriber keeps every "um" (many speech-to-text models silently drop them).
- **Stutters and repeated phrases:** "the the", "so so so".
- **Retakes and false starts:** say a sentence twice and it keeps the last clean one.
- **Dead air:** long pauses shrink to a natural 0.25 s.
- **Clean cuts:** every boundary snaps to the quietest 10 ms nearby, with 15 ms fades, so you don't hear clicks.

## Finish in your editor

Add `--edl` to also write `my-video.umless.edl` next to the render: an EDL (CMX 3600) for Premiere, Resolve, Avid, with one event per kept segment pointing at your original file, so you can keep editing instead of taking our render. Frame rate comes from the source (30 fps if it can't be read); 29.97 and 23.976 are written as non-drop-frame timecode. FCPXML is still planned.

## How it works

1. `ffmpeg` pulls the audio track.
2. AssemblyAI Universal (through OpenRouter) transcribes it word by word with timings.
3. Rules mark fillers and repeats, and an LLM (`gpt-5-mini` by default) marks retakes and false starts.
4. `ffmpeg` renders the kept segments into a new file.

Change the models with `UMLESS_STT_MODEL` and `UMLESS_LLM_MODEL`. The pipeline is in [`lib/pipeline.ts`](lib/pipeline.ts) and the CLI in [`cli/umless.ts`](cli/umless.ts).

To try it before using your own footage, run it on `testdata/demo_raw.mp4`, a 39 s take with 9 ums, 6 stutters and a retake.

## Why open source

Most filler-word removers are closed. You can't see why a word was cut, and you pay per minute forever. With Umless you can read every rule, change the thresholds and run it in your own scripts and pipelines.

## Don't want a terminal?

- **[Umless hosted](https://umless.thoufeekxlabs.com/?ref=github):** upload in the browser, plus Studio Sound and re-voicing a clean script in your own voice. Join the waitlist.
- **[Done-for-you](https://umless.thoufeekxlabs.com/?ref=github):** send raw recordings and get finished edits back. Your first cleanup is free.

## Roadmap

- `npx umless`, with no clone needed
- FCPXML timeline export for Final Cut Pro and Kdenlive (EDL is already in, see `--edl`)
- A `--json` cut list and an MCP server for agents and automation pipelines
- A local transcription option (whisper.cpp)

Want one of these sooner? Open an issue or send a PR.

## Contributing

Issues and PRs are welcome. If Umless cut something it shouldn't have, open an issue with the command you ran and the struck-through transcript it printed. Development and deploy notes for the hosted app are in [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## License

MIT © 2026 ThoufeekX Labs
