# Umless

Your video, minus the ums. Upload a demo or talking video; get back a clean take with no ums, stutters, retakes or dead air. Optionally re-voiced from a polished script.

Plan, GTM and scripts: https://claude.ai/artifact/Ku3wPLFtBDZH5M75ePvSFR

## Run

```bash
npm install
npm run build && npm start   # http://localhost:3210
```

Needs `ffmpeg` on the PATH and `AudioBet/.env` with `OPENROUTER_API_KEY` (all AI calls) and `ADMIN_KEY` (dashboard).
The current OpenRouter key is borrowed from `YourBrandOnSaasYearbook/.env.local` and must be replaced (see `.env` header).

## Pages

- `/` landing, pricing, two-step waitlist with referral links (rows go to `data/waitlist.jsonl`)
- `/admin?key=<ADMIN_KEY>` funnel dashboard; `/api/digest?key=<ADMIN_KEY>` plain-text digest (events in `data/events.jsonl`)
- `/um-score` free Um Score tool with a shareable X card
- `/studio` Clean Cut, Studio Sound, Re-voice
- `/remove-filler-words-from-video` and 5 more SEO pages (`lib/seo.ts`)

## Engine (`lib/pipeline.ts`), all through OpenRouter

1. AssemblyAI Universal-3.6 Pro transcribes word by word (keeps every "um"; Whisper, Deepgram and Grok drop them).
2. Rules mark fillers and repeated phrases; gpt-5-mini marks retakes and false starts.
3. ffmpeg cuts the kept segments, each boundary snapped to the quietest 10 ms nearby, with 15 ms fades; long pauses shrink to 0.25 s.
4. Studio Sound: local ffmpeg denoise + compression + loudness normalisation (free).
5. Re-voice: gpt-5-mini polishes each sentence; HeyGen Voice (stateless clone from a 15 s sample of the speaker, free tier first)
   or a Gemini stock voice speaks it; each video segment is stretched to fit its new line.

Cost: about $0.03 for a 3-minute Re-voice. Override models with `UMLESS_STT_MODEL` / `UMLESS_LLM_MODEL`.

## CLI (open-source bait)

```bash
OPENROUTER_API_KEY=... npx tsx cli/umless.ts my-demo.mp4          # writes my-demo.umless.mp4
OPENROUTER_API_KEY=... npx tsx cli/umless.ts my-demo.mp4 --score  # just the Um Score
```

## Test data

`testdata/demo_raw.mp4` is a synthetic 39 s take with 9 ums, 6 stutters and a retake.
`testdata/walkthrough_raw.mp4` is the same take over screenshots of the app (source of the site's demo clips).
`npm run pipeline -- testdata/walkthrough_raw.mp4 revoice` runs every stage and caches the transcript.

## Marketing

`marketing/umless-demo-x.mp4` is the 40 s before/after video for X.

## Research

`research/demand.md`, `research/nevo-playbook.md`, `research/trustmrr.md`.

## Deploy (Linux Lite laptop, ssh alias `umless-box`, Tailscale 100.98.47.6)

- `scripts/deploy.sh staging` pushes this Mac's code to staging: private, http://100.98.47.6:3210 (Tailscale only).
- `scripts/deploy.sh prod` promotes exactly what staging runs to prod: public, https://umless-app.thoufeekxlabs.com. The landing page at umless.thoufeekxlabs.com is the laptop session's Cloudflare Worker.
- `deploy/go-public.sh` (once) creates prod's Cloudflare tunnel + DNS, then promotes.
- Each env: `/opt/umless-<env>` (code, `.env`, compose), its own image tag, data volume and admin key.
  Rollback: `docker tag umless-app:<env>-previous umless-app:<env> && docker compose up -d` in that folder.
- Remove everything: `bash /opt/umless-staging/uninstall.sh`.
