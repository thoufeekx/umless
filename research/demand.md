# AudioBet demand research: which AI audio product can reach $2k MRR in 60 days

Researched 2026-11-06. Every claim links to a page I opened, or to a search or API endpoint I queried. Reddit blocks direct fetching from this environment, so Reddit threads were read through the reddit.sentinel-team.org snapshot mirror. Each one lists the original reddit.com URL next to the mirror link. X/Twitter pages returned HTTP 402 and could not be read. Pain points are mostly paraphrased with links, and verbatim quoting is kept to a minimum.

---

## 1. Ranked verdict

| Rank | Idea | Verdict | Why |
|---|---|---|---|
| **1** | **A, narrowed: "Your voice, minus the ums and the accent" for screen-recorded demos** | **BUILD** | Real, repeated pain: re-recording, stumbling, hating your own voice, accent anxiety. Competitors that start from a rough recording (DemoPolish, Clueso, Trupeer, Speakthrough, dub.house) mostly re-voice with **stock voices**. Clueso and Trupeer keep cloning on Enterprise only. Descript can do it, but only inside a full editor with per-line limits. Unit cost is about $0.30–$1.10 per 3-min job, so even $19–$39/mo gives 80%+ gross margin. Founder fit is strong: a non-native speaker selling to indie builders. |
| 2 | C. AI voiceover for app/SaaS demo and launch videos | Fold into A as the "pro stock voice" option. Do not sell it standalone. | Very crowded. DemoPolish sells it at $29/mo, Clueso at $40/mo, Trupeer at $40–49/mo, and many more. Founders already do it themselves with ElevenLabs for about $7 a script. The exact-match keywords ("ai voiceover for demo video") return no Google autocomplete at all. |
| 3 | B. Accent clarity / voice polish for creators and remote workers | Don't build it standalone. Ship accent clarity as a slider inside A. | The market is real (BoldVoice: $10M ARR, 5M downloads), but people pay for *training*. Real-time conversion belongs to Krisp ($8–16/mo) and Sanas (enterprise). ElevenLabs speech-to-speech at $0.12/min costs $7.20 per meeting-hour, which can't compete. A consumer "fix your accent in videos" app (Rayo) has only 23 App Store ratings after two years. |
| 4 | D. Podcast/Spaces/YouTube → clips + dubbed versions | **AVOID** | Commoditized. YouTube's auto-dubbing is free for everyone in 27 languages. HeyGen ($29), Rask ($39–249), Captions ($9.99+), and ElevenLabs' own Dubbing ($0.50/min) already cover it. Clipping is owned by OpusClip and others. |
| Extra E | Personalized outreach voice/video in your cloned voice | A reasonable product #2 later | Strong willingness to pay: Sendspark charges $49–$699/mo with voice-cloned name insertion. It needs video and lip-sync, has many competitors, and pulls you into sales tooling. |
| Extra F | AI phone receptionist for local businesses | Strong money signal, wrong audience for 60 days | Buyers pay $49–$300/mo (Rosie, Goodcall, Smith.ai). Your 3.3k indie-builder followers aren't the buyers, the market is crowded, and the sales cycle is long. |
| Extra G | "Release refresh": re-voice and re-sync a demo after the UI changes | Retention feature for A | Stale demos after every release is a repeated complaint. It makes A a monthly subscription instead of a one-off purchase. |

### The wedge that beats Descript and ElevenLabs

1. **Upload one file and get a finished video back. No editor to learn.** Descript makes you work in a timeline editor. Its Regenerate feature needs a "custom AI speaker" set up first, works in English only, and handles at most 250 characters per action ([Descript help](https://help.descript.com/hc/en-us/articles/13832955606413-Use-Regenerate-to-change-what-was-said)). Filler removal now uses credits on some plans, and reviewers say Overdub sounds robotic on longer passages ([stigstack Descript review](https://stigstack.pages.dev/reviews/descript-review), via [search summary](https://sonix.ai/resources/descript-review-pricing/)). ElevenLabs only sells components (TTS, voice changer, isolator). You still have to write the script, generate the audio, and sync it to your screen recording yourself.
2. **Your own cloned voice at an indie price.** Clueso includes voice cloning only on Enterprise ([Clueso pricing](https://www.clueso.io/pricing)). Trupeer keeps "custom voice clones" on Enterprise ([Trupeer pricing](https://www.trupeer.ai/pricing)). DemoPolish offers 6 stock voices and doesn't mention cloning ([demopolish.com](https://demopolish.com)). Founders do want their own voice. One commenter on a re-voicing tool asked whether it keeps your voice or generates a new one ([r/GrowthHacking](https://reddit.com/r/GrowthHacking/comments/1sfmndx/why_do_we_rerecord_videos_5_times_and_still_hate/), [mirror](https://reddit.sentinel-team.org/posts/1sfmndx/snapshots/2026-04-09T06%3A15%3A31.889479Z)). A developer built a whole local pipeline so his PR demos would play "in my voice" ([dev.to](https://dev.to/dorlugasigal/my-pr-demo-videos-make-themselves-now-in-my-voice-505i)).
3. **An accent-clarity slider for non-native speakers.** ElevenLabs Voice Remixing can change the accent of an Instant Voice Clone you own, and it works through the API ([ElevenLabs docs](https://elevenlabs.io/docs/overview/capabilities/voice-remixing)). Instant clones often fail to keep a non-native English accent anyway, because ElevenLabs only has US, UK, AU, and CA English accent data ([Synthesia help](https://help.synthesia.io/en/articles/9770805-why-is-my-accent-not-being-captured-in-my-voice-clone)). The default output is already "your timbre, clearer English", which is exactly what this buyer wants. No mainstream demo tool sells it.
4. **Positioning and launch line:** "Record it once, badly. Get it back in your voice, minus the ums, restarts, and accent." Lead with before/after clips on X. The founder being a non-native speaker is the demo.

### What to charge (see section 8 for costs)
- Free: 1 video up to 2 min, watermarked. This doubles as the SEO free tool.
- **Solo $29/mo**: 10 videos/mo up to 10 min each, your voice clone, accent slider.
- **Pro $59/mo**: 30 videos, multiple voices (founder plus team), stock pro voices, "release refresh".
- Pay-per-video $12, for one-off launch videos. Many indie buyers need one demo per launch.
- $2,000 MRR ≈ 69 Solo customers or 34 Pro, or a mix such as 40 Solo plus 14 Pro. 3.3k followers alone probably won't get there. Plan for Product Hunt, the SEO free tool (section 7), and directories.

---

## 2. Idea A: "Fix my voice in my demo video"

**Who pays:** indie SaaS founders before a launch (Product Hunt, X, landing page hero video), SaaS marketers who make feature and release videos, course creators, and non-native English creators and founders.

**What they pay today:**
- Descript: Hobbyist $16/mo annual or $24 monthly (10 media hrs, 400 AI credits). Creator $24 or $35. Business $50 or $65 ([descript.com/pricing](https://www.descript.com/pricing)).
- Human freelancers: Fiverr voiceover gigs start around $15 ([search summary citing Fiverr](https://supademo.com/blog/how-to-make-saas-product-demo-video-with-ai)). Localized human voice actors run $200–400 per language per video ([r/EntrepreneurRideAlong](https://reddit.com/r/EntrepreneurRideAlong/comments/1qq0mem/creating_localized_product_demos_for_global_users/), [mirror](https://reddit.sentinel-team.org/posts/1qq0mem/snapshots/2026-01-29T20%3A21%3A39.870793Z)).
- Their own time: one team said each demo video took 4–6 hours ([r/ClaudeAI](https://reddit.com/r/ClaudeAI/comments/1stutgf/holy_shit_i_just_automated_something_i_thought/), [mirror](https://reddit.sentinel-team.org/posts/1stutgf/snapshots/2026-04-24T01%3A51%3A22.406527Z)). OpusClip estimates that manually removing fillers from a 10-minute video takes 45–90 minutes ([OpusClip blog](https://www.opus.pro/blog/best-filler-word-removers)).

**Direct competitors (rough recording in, polished narrated video out):**

| Product | Price | Own-voice clone? | Notes |
|---|---|---|---|
| DemoPolish | $3 trial, then $29/mo for 100 videos | Not mentioned; 6 AI voices | Rewrites narration, drops "ums", about 60-second turnaround ([demopolish.com](https://demopolish.com); listed on AlternativeTo Feb 2026, [alternativeto](https://alternativeto.net/software/demopolish-com/about)) |
| Clueso | Solo $40/mo annual, Business $120/mo | Enterprise only | AI script rewrite and voiceovers, "hours in 15 minutes" ([clueso.io/pricing](https://www.clueso.io/pricing)) |
| Trupeer | Pro $40 annual / $49 monthly, Scale $199 / $249 | Enterprise only | Screen recording turned into video plus docs ([trupeer.ai/pricing](https://www.trupeer.ai/pricing)) |
| dub.house | Free tier | Unclear | "Studio narration for your demos, without re-recording." **2 upvotes** on Product Hunt ([PH](https://www.producthunt.com/posts/1242363)) |
| Speakthrough | Paid tiers include cloning | Yes, paid tiers | **3 upvotes**, ranked 118th as Product of the Day ([hunted.space](https://www.hunted.space/product/speakthrough)) |
| Descript | $16–$65/mo | Yes (custom AI speaker) | Editor-based; Regenerate is English-only and limited to 250 characters per action ([help](https://help.descript.com/hc/en-us/articles/13832955606413-Use-Regenerate-to-change-what-was-said)) |
| Loom | Business+AI tier | No | Removes fillers and silences, but "not possible… to capture all filler words" ([Atlassian support](https://support.atlassian.com/loom/docs/remove-filler-words-and-silences-from-your-video/)) |
| Captions | Max $24.99/mo for AI Edit | AI Twin | Mobile-first creator app ([Captions docs](https://captions.ai/help/docs/subscriptions.md)) |

**Read:** the category is validated: at least five products shipped in 2025–26. The two pure-indie launches got almost no Product Hunt votes, though. That means distribution and differentiation decide the outcome, not the idea. The open gaps are **own voice plus accent clarity at indie prices**, and **keeping your best original takes** (hybrid splicing) instead of replacing everything with TTS.

**Pain evidence (paraphrased, with links):**
- The dub.house maker said he always hated recording voiceovers: stumbling, restarting, and re-recording the same minute ([Product Hunt](https://www.producthunt.com/posts/1242363)).
- The Speakthrough maker listed having to re-record the voiceover himself, in a voice that was wrong for the brand, as his reason for building it ([hunted.space](https://www.hunted.space/product/speakthrough)).
- A founder wrote that demo videos are a five-job pipeline. Either you record yourself, which most people hate, or you hire someone, and the recording goes stale with every release ([dev.to/demovexa](https://dev.to/demovexa/why-most-features-ship-without-a-demo-video-and-what-actually-helps-4o2g)).
- An indie dev described the loop: write a rough script, stumble on line three, start over, so the demo keeps getting pushed. He also said he is sick of his own voice ([dev.to/yooi](https://dev.to/yooi/i-built-a-tool-so-id-stop-re-recording-my-demos-40c9)).
- Another indie dev spent hours recording and EQ-ing narration that still didn't sound right. He has no pro mic and said retakes and localization made it worse ([dev.to/duker](https://dev.to/duker/the-first-time-i-heard-a-computer-speak-and-why-i-dont-record-voiceovers-anymore-52b6)).
- A thread asked why people re-record videos five times and still hate them. A commenter agreed they hate how they sound ([r/GrowthHacking](https://reddit.com/r/GrowthHacking/comments/1sfmndx/why_do_we_rerecord_videos_5_times_and_still_hate/), [mirror](https://reddit.sentinel-team.org/posts/1sfmndx/snapshots/2026-04-09T06%3A15%3A31.889479Z)).
- A team said demo videos convert better than any blog post or tweet. Each took a 4–6 hour grind, and when someone was tired the videos didn't happen ([r/ClaudeAI](https://reddit.com/r/ClaudeAI/comments/1stutgf/holy_shit_i_just_automated_something_i_thought/), [mirror](https://reddit.sentinel-team.org/posts/1stutgf/snapshots/2026-04-24T01%3A51%3A22.406527Z)).
- A solo founder with what he called a thick Spanish accent publicly debated staying on camera or switching to a polished AI voice ([dev.to/jaymoreno](https://dev.to/jaymoreno/should-i-keep-my-face-on-camera-with-my-accent-or-go-faceless-with-a-polished-ai-voice-5225)).
- Hacker News: a reviewer advised a founder to redo the voiceover on his prominent demo video and mentioned his accent ([HN 1181181](https://news.ycombinator.com/item?id=1181181)). Another founder with a strong Latino accent shared how he got professional voiceovers for his demo videos ([HN 6304962](https://news.ycombinator.com/item?id=6304962)).
- Descript users ask for filler removal that doesn't leave the speaker sounding robotic, and complain that it is now charged in credits ([Descript feedback board](https://feedback.descript.com/feature-requests/p/remove-filler-words-from-transcript-only), [search summary](https://vidpros.com/descript-review/)).

**Risks:** stock-voice tools are cheap ($29 for 100 videos). Descript could make Regenerate simpler. Voice-consent abuse is possible, so only let users clone their own voice and require a spoken consent phrase. ElevenLabs Eleven v4 *preserves* the accent when reference and output are both English ([v4 docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4)), so the accent slider should go through Voice Remixing or the v3/v2 models. Test this on the founder's own voice first.

---

## 3. Idea B: Accent clarity / voice polish

**Who pays:** non-native professionals, mostly for **training**, plus call centers and BPOs, which pay for **real-time conversion** at enterprise contract prices.

**Proof of spend:** BoldVoice has passed $10M ARR with 5M+ downloads and seven people, and raised a $21M Series A led by Matrix in Jan 2026 ([The AI Insider](https://theaiinsider.tech/2026/02/04/boldvoice-raises-21m-series-a-to-give-a-billion-non-native-english-speakers-their-own-ai-voice-coach/)). Its App Store in-app purchases range from $14.99 to $199.99, with 12-month Premium at $149.99 ([apppricinglab](https://apppricinglab.com/iap/apple/1567841142)).

**Competitors and pricing:**
- Krisp Accent Conversion: Core $8/mo annual or $16 monthly (1 hr/day). Advanced $15 or $30. Accents covered include Indian, Filipino, South African, and LatAm ([krisp.ai/pricing](https://krisp.ai/pricing/)). Krisp's own data claims 79% of US customers ask non-native agents to repeat themselves ([Decrypt](https://www.decrypt.co/311751/accent-job-krisps-ai-tool)).
- Sanas: enterprise and contact-center only, with no consumer price published ([search summary](https://developer.sanas.ai/Docs/Resources/Pricing.md)).
- Rayo "Accent FIX & Voice changer" (iOS): "GET RID OF YOUR ACCENT IN VIDEOS", $14.99/mo or $99.99/yr, **only 23 ratings since Nov 2024** ([iTunes lookup](https://itunes.apple.com/lookup?id=6737751758&country=us)).
- Altered AI and CapCut offer accent changers. CapCut's is free inside its editor ([search summary](https://www.capcut.com/resource/best-accent-changers)).

**Pain evidence:**
- A YouTuber worried that a Pakistani or Indian accent would put off a Western audience and asked whether to use an AI voiceover. One reply preferred the AI voice; others said real voices win ([r/PartneredYoutube](https://reddit.com/r/PartneredYoutube/comments/1sh99sn/indianpakistani_accent_or_ai_voiceover/), [mirror](https://reddit.sentinel-team.org/posts/1sh99sn/snapshots/2026-04-10T11%3A07%3A17.909767Z)).
- A new YouTuber with a self-described bad accent asked what to use and noted the community dislikes AI voiceovers ([r/NewTubers](https://reddit.com/r/NewTubers/comments/1psyy6y/what_to_use_when_having_a_bad_voice/), [mirror](https://reddit.sentinel-team.org/posts/1psyy6y/snapshots/2025-12-22T20%3A50%3A47.343782Z)).
- A streamer insecure about his voice asked to turn his mic into a TTS voice ([r/Twitch](https://reddit.com/r/Twitch/comments/1swhusp/use_my_mic_for_tts/), [mirror](https://reddit.sentinel-team.org/posts/1swhusp/snapshots/2026-04-27T20%3A27%3A15.685162Z)).
- A user said Krisp's accent conversion makes their speech clearer ([Product Hunt, Krisp](https://www.producthunt.com/posts/krisp-accent-conversion)).

**Verdict:** the demand is real, but the money is in coaching and in enterprise real-time. Real-time through ElevenLabs costs $0.12/min ([ElevenLabs API pricing](https://elevenlabs.io/pricing/api)), or $7.20 per hour. Krisp charges $8/mo for 1 hr/day, so the economics don't work. Offer **file-based** accent clarity for recorded video, and do it inside A.

---

## 4. Idea C: AI voiceover for app/SaaS demo and launch videos

**Who pays:** the same buyers as A, but people who would rather write a script than record one.

**Competitors and pricing:**
- ElevenLabs Starter $6/mo with Instant Voice Cloning, Creator $22 with Professional Voice Cloning ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)). One founder made a whole Product Hunt demo voiceover with ElevenLabs for about $7 ([search summary](https://supademo.com/blog/how-to-make-saas-product-demo-video-with-ai)).
- Murf: Creator about $19–29/mo, Business about $66–99/mo, with cloning on Business+ per most sources ([search summary](https://smallest.ai/blog/murf-ai-pricing-plans-cost-what-you-get-in-2026)).
- WellSaid: Starter $10/mo annual or $19 monthly (20 min/mo). Pro $33 or $49. Business $160/user ([wellsaid.io/pricing](https://www.wellsaid.io/pricing)).
- Speechify Studio: Basic $69/mo, Professional $99/mo with cloning ([krater.ai, checked Oct 2026](https://krater.ai/pricing/speechify)).
- Plus everything listed for A: DemoPolish, Clueso, Trupeer, Speakthrough, and Supademo's AI demo maker ([supademo](https://supademo.com/tools/product-demo-video-maker)).

**Demand signal:** Google autocomplete returns **nothing** for "ai voiceover for demo video", "ai voiceover for product demo", or "demo video voiceover". Demand clusters around "saas demo video maker ai", "product demo video ai", and "loom ai voiceover" instead (section 7).

**Pain evidence:** an EntrepreneurRideAlong poster said their demos feel very American, human voice actors cost $200–400 per language per video, and they worry about AI accent quality ([r/EntrepreneurRideAlong](https://reddit.com/r/EntrepreneurRideAlong/comments/1qq0mem/creating_localized_product_demos_for_global_users/), [mirror](https://reddit.sentinel-team.org/posts/1qq0mem/snapshots/2026-01-29T20%3A21%3A39.870793Z)).

**Verdict:** a commodity. Offer it as a mode inside A ("use a pro voice instead of mine").

---

## 5. Idea D: Podcast/X Spaces/YouTube → clips + dubbed versions

**Competitors and pricing:**
- YouTube auto-dubbing is free inside YouTube, available to all users, with 27 languages as of Feb 2026 ([India TV News](https://www.indiatvnews.com/technology/news/youtube-auto-dubbing-feature-expands-to-all-users-now-supports-27-languages-2026-02-05-1029070)). Search summaries say about 6M daily viewers watched 10+ minutes of auto-dubbed content in Dec 2025.
- HeyGen: Creator $29/mo ($24 annual), translation up to 30 min per video, 175+ languages ([heygen.com/pricing](https://www.heygen.com/pricing)).
- Rask: Creator $39/mo (25 min), Creator Pro $99 (100 min), Business $249 (250 min), extra minutes $3 ([rask.ai/pricing](https://www.rask.ai/pricing)).
- Captions: Basic $9.99 includes "Caption & Dub" ([Captions docs](https://captions.ai/help/docs/subscriptions.md)).
- ElevenLabs Dubbing API: $0.50/min without watermark, $2.20/min for Dubbing v2 ([ElevenLabs API pricing](https://elevenlabs.io/pricing/api)).
- Mobile apps for "ai dubbing" are crowded with low-rated clones. Vozo has 2,131 ratings and most others have fewer than 250 ([iTunes search](https://itunes.apple.com/search?term=ai%20dubbing&entity=software&country=us)).

**Pain evidence:** reviewers note timing mismatches between languages, and that ElevenLabs Dubbing lacks lip-sync ([search summary](https://stigstack.pages.dev/reviews/elevenlabs-review)). There is little evidence that X Spaces hosts pay. "x spaces to mp3" and "x spaces to transcript" show up in autocomplete, but nothing about dubbing.

**Verdict:** avoid. Platforms give it away, and well-funded players already own the paid tier.

---

## 6. Extra ideas with stronger money evidence

**E. Voice-cloned personalized outreach.** Sendspark Solo costs $49/mo for 100 dynamic minutes, Growth $99, Team $299, Business $699, and every plan includes AI voice cloning plus name personalization ([sendspark.com/pricing](https://www.sendspark.com/pricing)). This proves sales teams pay well. It needs video and lip-sync work, though, and it's crowded (Tavus, Hippo). Good as product #2 once A has users.

**F. AI receptionist for local businesses.** Rosie starts around $49/mo for 250 minutes, Goodcall $79–299, Smith.ai AI about $150 for 75 calls ([search summary](https://dupple.com/learn/best-ai-receptionists)). This is the clearest "saves money" pitch in audio, but your audience doesn't buy it, so skip it for the 60-day goal.

**G. Release refresh (inside A).** After every UI change, re-voice the changed lines and re-sync them to new footage. Evidence: demos going stale is a repeated complaint ([dev.to/demovexa](https://dev.to/demovexa/why-most-features-ship-without-a-demo-video-and-what-actually-helps-4o2g), [dev.to/dorlugasigal](https://dev.to/dorlugasigal/my-pr-demo-videos-make-themselves-now-in-my-voice-505i)). This is what turns one-off buyers into subscribers.

---

## 7. Keyword demand and app store crowding

Exact search volumes need an SEO data source. The Ahrefs and Similarweb plugins in this workspace require authorization through `/mcp`. Below are **Google autocomplete** results (more and richer suggestions mean more demand) from `suggestqueries.google.com`, queried 2026-11-06, and App Store and Play Store crowding.

### Google autocomplete signals

| Seed | Suggestions returned (selection) | Read |
|---|---|---|
| remove filler words | capcut · from video free · from video · from audio · premiere pro · from video online free · davinci resolve | Strong demand. Strong "free" intent. Editors (CapCut, Premiere) own it. |
| remove ums | from video · from video capcut · from audio · in premiere pro · and uhs | Strong, editor-tied |
| remove pauses / silence from video | online free · capcut · ai · premiere pro · app | Strong, free intent |
| accent changer | free · ai · app · **for calls** · online · extension · **real time** | Strong, call/real-time intent (Krisp territory) |
| accent changer ai | free · voice · **video accent changer ai** · live · real time | "video accent changer" exists, which suits the A wedge |
| ai accent | detector · changer · coach · **removal** · masking | Accent removal has demand |
| voice changer ai | free online · app · **for video** · song | Mostly entertainment |
| replace my voice in video | change my voice in video · **replace voice in video with my voice** · how to replace voice in video | Directly matches A |
| fix my voice | ai · recording | Weak |
| ai voiceover for | video · youtube videos · reels · tiktok · powerpoint | Big generic market, but "demo" is absent |
| ai voiceover for demo video / product demo, demo video voiceover | **no suggestions** | Low exact-match volume |
| product demo video ai | ai video generator · maker ai free · **saas product demo video ai** · reddit | Moderate |
| saas demo video | maker · template · maker ai · ai · generator · agency | Moderate, buyer intent |
| loom voiceover | **loom ai voiceover** · add voiceover | Loom users want AI voiceover |
| descript alternative | free · reddit · open source · ai | Switching intent exists |
| elevenlabs alternative | free · reddit · for voice cloning | Price-sensitive |
| dub youtube video / ai dubbing | free · online · free unlimited · no sign up | Free-seeking, avoid |
| x spaces to | mp3 · transcript | No dubbing intent |

### App Store crowding (iTunes Search API, US, top results with rating counts)

| Keyword | Crowding | Leaders (ratings) |
|---|---|---|
| remove um / remove filler words | **Empty**. Only "Podcast Cleaner: Um Remover" with **0 ratings**; the rest are word games | No mobile demand. This is a web/desktop job. |
| accent changer | Medium: novelty voice changers plus Rayo (23 ratings) | Voice Changer (53k), Revoice (15.6k) |
| accent reduction | **Crowded with strong incumbents** | ELSA (114k), BoldVoice (54k), Accent Training (11k) |
| voice changer ai | Crowded, novelty | Voices AI (27.7k), Celebrity Voice Changer (32.7k) |
| ai voiceover | Crowded | ElevenLabs (24k), Narrator's Voice (10.5k) |
| ai dubbing / video translator | Many weak clones | Vozo (2.1k), Dub AI (225) |

Source: `https://itunes.apple.com/search?term=<kw>&entity=software&country=us`.

### Play Store crowding (play.google.com search, US)
- "remove filler words": the top 30 are all photo text or object removers, with **no filler-word apps**.
- "accent changer" and "voice changer ai": 30 results, including ElevenLabs, Speechlab, MagicMic, Dubbing AI, and VoxBox. Crowded.
- "accent reduction": ELSA, Accentify, ChatterFox, Speakometer, and similar. Crowded.
- "ai dubbing": 29 results (Dubbing AI, Voiser, Vozo and others). Crowded.

Source: `https://play.google.com/store/search?q=<kw>&c=apps&hl=en&gl=US`.

**Conclusion:** build A as a **web app**, not a mobile app. Mobile is empty for filler removal and saturated for accent and voice.

### SEO keyword list for A (start with free-tool pages, then convert to paid)
1. remove ums from video (free / online)
2. remove filler words from video online free
3. remove pauses from video online free / remove silence from video ai
4. replace voice in video with my voice
5. change my voice in video
6. video accent changer ai / accent changer for video
7. ai accent removal
8. saas product demo video ai / saas demo video maker ai
9. product demo video maker ai free
10. loom ai voiceover (Loom-to-polished-video angle)
11. descript alternative (simple / no editor)
12. ai voiceover for youtube videos / screen recording voiceover (mac / windows)
13. clean up audio in video ai
14. elevenlabs alternative for voice cloning (comparison page)

---

## 8. Unit cost per job: a typical 3-minute demo video

Prices from [ElevenLabs API pricing](https://elevenlabs.io/pricing/api) and [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), both opened 2026-11-06:
- ElevenLabs TTS v4/v3/v2: $0.08 per 1K characters. Flash/Turbo: $0.04 per 1K.
- Scribe v2 speech-to-text: $0.22 per hour.
- Voice Changer (speech-to-speech): $0.12/min.
- Voice Isolator: $0.12/min.
- Dubbing v1: $0.50/min (no watermark). Dubbing v2: $2.20/min.
- OpenAI whisper-1: $0.006/min. gpt-4o-mini-transcribe: about $0.003/min.
- gpt-5-mini: $0.25 per 1M input tokens, $2.00 per 1M output tokens.
- Instant Voice Cloning comes with ElevenLabs Starter and above ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)). Voice Remixing cost "depends on the length of the test script" ([docs](https://elevenlabs.io/docs/overview/capabilities/voice-remixing)), and it's a one-time cost per user.

Assumptions: 3 minutes of speech is about 420 words including fillers. The cleaned script is about 330 words, or about 2,200 characters. GPT cleanup takes about 6K tokens in and 2K tokens out.

| Step | Lean pipeline | Full pipeline (noisy mic, 2× regenerations) |
|---|---|---|
| Voice isolation (3 min × $0.12) | skip | $0.36 |
| Transcribe with word timestamps (Scribe v2, 3 min) | $0.011 | $0.011 |
| Script cleanup (gpt-5-mini) | $0.006 | $0.01 |
| Re-voice with cloned voice: TTS v3/v4, 2.2K chars × $0.08 | $0.18 (×1.5 buffer = $0.26) | $0.35 (×2) |
| *Alternative: speech-to-speech on the trimmed ~2.5 min × $0.12* | *$0.30* | *$0.30* |
| Voice clone / accent remix | one-time, about $0 per job | one-time |
| ffmpeg render, storage, egress (estimate) | about $0.02 | about $0.05 |
| **Total per 3-min job** | **about $0.30** | **about $0.80–$1.10** |

- Using Flash TTS ($0.04/1K) roughly halves the TTS line.
- Using whisper-1 instead of Scribe costs $0.018.
- **Idea C (script to voiceover only):** about $0.10–$0.26 per 3 minutes.
- **Idea D (dub one 3-min clip into one language):** $1.50 with ElevenLabs Dubbing v1, $6.60 with v2, or about $0.25 if you build it yourself (transcribe, translate, TTS).
- **Idea B (real-time call polish through ElevenLabs speech-to-speech):** $7.20 per meeting-hour. Not viable against Krisp at $8/mo.

**Margin check for A:**
- Solo plan at $29 with 10 videos used: about $3 (lean) to $11 (full) in API costs, so a 62–90% gross margin.
- A typical user does 3–4 videos a month, which is about $1–4, so 85–95%.
- Pay-per-video at $12: about $1 in API cost plus card fees (assume about 3% + $0.30), so about 88% margin.
- Cap video length (10 min) and regenerations per video to protect the worst case.

---

## 9. Five strongest pain signals (for copy and outreach)

1. Each demo video took a 4–6 hour grind, and videos didn't get made when someone was tired ([r/ClaudeAI](https://reddit.com/r/ClaudeAI/comments/1stutgf/holy_shit_i_just_automated_something_i_thought/), [mirror](https://reddit.sentinel-team.org/posts/1stutgf/snapshots/2026-04-24T01%3A51%3A22.406527Z)).
2. A maker always hated recording voiceovers: stumbling, restarting, re-recording the same minute ([dub.house on Product Hunt](https://www.producthunt.com/posts/1242363)).
3. A maker had to re-record the voiceover in a voice he felt was wrong for the brand ([Speakthrough, hunted.space](https://www.hunted.space/product/speakthrough)).
4. A creator worried a South Asian accent would put off a Western audience and weighed an AI voice ([r/PartneredYoutube](https://reddit.com/r/PartneredYoutube/comments/1sh99sn/indianpakistani_accent_or_ai_voiceover/), [mirror](https://reddit.sentinel-team.org/posts/1sh99sn/snapshots/2026-04-10T11%3A07%3A17.909767Z)).
5. Recording yourself, "which most of us hate", plus demos going stale every release ([dev.to/demovexa](https://dev.to/demovexa/why-most-features-ship-without-a-demo-video-and-what-actually-helps-4o2g)).

Runner-up: localized human voiceovers at $200–400 per language per video don't scale ([r/EntrepreneurRideAlong](https://reddit.com/r/EntrepreneurRideAlong/comments/1qq0mem/creating_localized_product_demos_for_global_users/)).

---

## 10. Gaps and caveats
- No exact keyword volumes. Authorize Ahrefs or Similarweb through `/mcp`, or use Google Keyword Planner, to rank the SEO pages.
- Reddit was read through a mirror. X posts couldn't be fetched (HTTP 402). Indie Hackers searches turned up no strong, relevant threads.
- Links marked "search summary" came from web-search result snippets and were not opened page by page. Treat them as lower confidence. Every other link was opened directly.
- Third-party pricing (Murf, BoldVoice tiers, Adobe Podcast, Speechify) conflicts between sources. Official pages were used where they loaded: Descript, ElevenLabs, OpenAI, Krisp, HeyGen, Rask, WellSaid, Clueso, Trupeer, Sendspark, Captions docs.
- Adobe Podcast: third-party sources say Enhance Speech is free for about 1 hr/day, with Premium about $9.99/mo for 4 hrs/day ([search summary](https://aitoolsatlas.ai/tools/adobe-podcast/pricing)). The official pricing page didn't render.
- Before building, prototype the accent-clarity path on the founder's own voice: Instant Voice Clone, then Remix to neutral, then v3 TTS. Results vary by voice ([ElevenLabs docs](https://elevenlabs.io/docs/overview/capabilities/voice-remixing)).
