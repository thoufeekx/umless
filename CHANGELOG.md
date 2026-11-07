# Changelog

All notable changes to Umless are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `--edl`: writes `<name>.umless.edl` next to the render, an EDL (CMX 3600) for Premiere, Resolve, Avid with one event per kept segment, source timecodes from the original file and back-to-back record timecodes from 01:00:00:00. Frame rate and the source's timecode track come from `ffprobe` (30 fps / 00:00:00:00 fallback); 29.97 and 59.94 are drop-frame unless the source timecode is non-drop. Renders now cut on whole source frames, so the EDL matches the rendered file frame for frame. FCPXML is still planned (#2).
- `npm test` runs the unit tests (`node:test` via `tsx`).

Planned (see [issues](https://github.com/thoufeekx/umless/issues)):
- `--json` output for scripts and agents (#1)
- FCPXML export for Final Cut Pro
- `npx umless` with no clone needed (#3)
- A clear error when `ffmpeg` is missing (#4)
- `--padding <ms>` around cuts (#5) and a custom filler-word list (#6)

## [0.1.0] - 2026-11-06

First public release. MIT licensed.

### Added
- CLI: `npx tsx cli/umless.ts <video|audio>` writes `<name>.umless.mp4` (audio comes out as `.m4a`).
- Cuts filler words (um, uh, er), stutters and repeated phrases, retakes and false starts (it keeps the last clean take), and dead air (long pauses shrink to 0.25 s).
- Clean cuts: every boundary snaps to the quietest 10 ms nearby, with 15 ms fades.
- `--score`: prints the Um Score (ums per minute, stutters and retakes, seconds of dead air) without rendering.
- The terminal shows the transcript with every cut word struck through, plus the before/after length.
- Bring your own OpenRouter key (about $0.02 for a 3-minute video). Needs Node 20+ and `ffmpeg`.

Tested end to end: a 39.4 s talking-head clip came out at 17.5 s.

[Unreleased]: https://github.com/thoufeekx/umless/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/thoufeekx/umless/releases/tag/v0.1.0
