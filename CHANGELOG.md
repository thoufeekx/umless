# Changelog

All notable changes to Umless are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- MCP server (`umless mcp`, stdio) with `analyze_video` (cut list JSON with timestamps and reasons) and `clean_video` (renders, returns output path and stats).
- Claude Code skill (`skills/umless`) and plugin marketplace manifest (`.claude-plugin/`).
- Runnable with `npx github:thoufeekx/umless`: `bin` entry, tsup build to `dist/`, `files` field, ffmpeg check with install hints (#3).

### Changed
- Transcription now uses ElevenLabs Scribe v2 plus a Parakeet second pass for missed ums. On three real clips, filler recall went from 4% to 91% (96% precision). AssemblyAI had dropped 27 s of real speech on one clip, which the old pipeline then cut as dead air.
- `next`, `react` and `react-dom` moved to devDependencies so the CLI package stays small; the Docker image no longer prunes dev dependencies.

Planned (see [issues](https://github.com/thoufeekx/umless/issues)):
- `--json` output for scripts and agents (#1)
- EDL / FCPXML export so cuts land in Premiere, Resolve and Final Cut (#2)
- `npx umless` from the npm registry (#3 covers running from GitHub)
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
