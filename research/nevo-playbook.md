# Nevo David's GTM playbook, and a 60-day X-first plan for AudioBet

Researched 2026-11-06. Every number has a source next to it. Revenue figures come from different dates and sources and often disagree. The most reliable ones come from Stripe through TrustMRR. The founder's own posts and third-party write-ups come next. Anything I could not check is marked **(unverified)**.

---

## 0. TL;DR

- **Who:** Nevo David (X: [@wickedguro](https://x.com/wickedguro)). Before Postiz he was head of growth at Novu, where he took the repo from about 2k to 20k+ stars in roughly a year (24k by Sep 2023). Before that he ran Linvo, a LinkedIn automation SaaS that made about $5k/mo, lost money and shut down.
- **Postiz** started as "Gitroom" in Jul 2023 and was relaunched as Postiz in Aug/Sep 2024. It is an AGPL open-source social scheduler with a paid cloud version. As of today TrustMRR shows **$374,574 MRR, 11,004 active subscriptions, and $1.75M all-time revenue**, with plans from $29/mo and a 7-day $0 trial ([trustmrr.com/startup/postiz](https://trustmrr.com/startup/postiz)).
- **The curve is the lesson.** It took about 16 months to reach about $16k/mo, with 15k+ stars and millions of Docker pulls along the way. Then two things changed:
  1. He went after a different audience: n8n automators, then AI agents.
  2. **Other people's content** went viral. One X article by an account with about 200 followers reached about 7.2M views.

  Revenue went from about $18k (Jan 2026) to about $46k (Feb), $82k (Mar), $152k (Jun) and $248k (Sep) ([aiolum.com](https://aiolum.com/story/postiz/), Stripe-verified monthly table).
- **The "brain"** is **Nevo's Brain** ([nevo.md](https://nevo.md/)). It is a free remote **MCP server** that loads his marketing playbook into Claude, ChatGPT, Cursor, Claude Code, OpenClaw and other agents. To use it you sign in with your email, and **signing in subscribes you to his newsletter**. It is a lead magnet built for AI agents. Details in section 3.

---

## 1. Zero to revenue: timeline

| Date | Milestone | Source |
|---|---|---|
| 2021 | Linvo (LinkedIn automation) makes about $5k/mo, burns more. He tries to sell it for $100k, gets no buyer, shuts it down | [X post, Oct 19 2026](https://x.com/wickedguro/status/2112240445187031273) (read via api.fxtwitter.com) |
| 2022 to early 2024 | Head of growth at Novu. Repo goes from about 2k to 20k+ stars in about a year, 24k by Sep 2023. Writes "tens of articles with a CTA to give us a star" | [dev.to interview](https://dev.to/crowddotdev/how-to-grow-a-github-project-to-20k-stars-with-nevo-david-novu-3i81), [star-history.com guest post](https://star-history.com/blog/do-github-stars-equal-money) |
| Jul 8 2023 | Repo created as "Gitroom" | [aiolum.com](https://aiolum.com/story/postiz/) |
| Before OSS | Spent about $3k/mo for 4 months on a freelance SEO and backlink person. Little result because domain authority was too low. Decided to "go open-source" | [HackerNoon](https://hackernoon.com/this-open-source-marketing-hack-could-set-you-up-for-financial-freedom-in-2025) |
| Aug 30 2024 | r/selfhosted post (527 score, 164 comments). First real users | [systemaic teardown](https://www.systemaic.com/teardowns/postiz) |
| Sep 2024 | Postiz launches. Free self-host, paid cloud "only for cloud costs" | [dev.to, Nov 2025](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179) |
| Nov 20 2024 | Product Hunt #1 of Day, Week and Month (about 1.2k upvotes). Show HN the same day got about 42 points | [systemaic](https://www.systemaic.com/teardowns/postiz), [aiolum](https://aiolum.com/story/postiz/) |
| Nov 2024 | About $700/mo | [aiolum](https://aiolum.com/story/postiz/) |
| Jan 2025 | About $2k/mo, 15k stars, 584k Docker pulls, 1,115 Discord members, about 4k cloud signups. License moves from Apache-2.0 to AGPL-3.0 | [HackerNoon](https://hackernoon.com/this-open-source-marketing-hack-could-set-you-up-for-financial-freedom-in-2025), [aiolum](https://aiolum.com/story/postiz/) |
| Early 2025 | **Stalls at about $3k MRR.** New signups only replaced churned customers | [X article "$100k MRR"](https://x.com/wickedguro/article/2055279858767552604) |
| Apr 2025 | MCP server ships | [aiolum](https://aiolum.com/story/postiz/) |
| Jul to Aug 2025 | $6,523 → $12,648/mo after shipping an official n8n node and cold-emailing owners of n8n communities on Skool | [dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179), [nevo.md](https://nevo.md/) |
| Nov 2025 | About $14k to $16k/mo, 4.79M Docker downloads. Founder reports burnout | [dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179) |
| Jan 2026 | About $21k MRR "after almost two years". OpenClaw skill released Jan 30 | [X article](https://x.com/wickedguro/article/2055279858767552604), [aiolum](https://aiolum.com/story/postiz/) |
| Feb 2026 | Oliver Henry's (about 200 followers) X article on his "Larry" OpenClaw agent, which posts TikTok slideshows through Postiz, gets **about 7M views**. Postiz trials go from about 100/mo to about 700 almost overnight | [Profitable Founder podcast](https://floriandarroman.buzzsprout.com/2026218/episodes/18973966-i-made-46k-in-35-days-with-openclaw), [Rob Hallam](https://robhallam.beehiiv.com/p/200-followers-7-2-million-views) |
| Mar 2026 | $66k MRR ("last $46k took 35 days"). Mixergy reports $45k+ | [Profitable Founder](https://floriandarroman.buzzsprout.com/2026218/episodes/18973966-i-made-46k-in-35-days-with-openclaw), [Mixergy](https://mixergy.com/interviews/revenue-jumped-when-he-sold-to-ai-agents/amp/) |
| Apr 2 2026 | Passes $1M ARR | [aiolum](https://aiolum.com/story/postiz/), [arr.club](https://www.arr.club/postiz/postiz-reaches-80k-mrr) |
| May 15 2026 | $100k MRR, >80% margins, solo, no funding | [X article](https://x.com/wickedguro/article/2055279858767552604) |
| Jul 2 2026 | $145k MRR, "growing $1k MRR per day". Post got 692k views | [X post](https://x.com/wickedguro/status/2072654822449586327) |
| Aug 10 2026 | "$2M ARR, step-by-step to replicate" X article. 208k views, 2.2k bookmarks | [X article](https://x.com/wickedguro/article/2086788813301661865) |
| Oct 14 2026 | $3M ARR announcement plus **Nevo's Brain** launch. 1.05M views, 1,048 bookmarks | [X post](https://x.com/wickedguro/status/2110347509948146070) |
| Oct 21 2026 | Railway key compromise. He takes Postiz offline (about 15h) and rotates 140 keys | [Dan Raine](https://danraine.substack.com/p/he-gives-his-software-away-free-it) |
| Oct 26 2026 | Staged "ex-employee leaks the source code" stunt with Will Baker. The code is open source anyway | [X post](https://x.com/wickedguro/status/2114860154881552414) |
| Nov 6 2026 | $374,574 MRR, 11,004 subscriptions (TrustMRR) | [trustmrr.com/startup/postiz](https://trustmrr.com/startup/postiz) |

**Stripe-verified monthly revenue** ([aiolum.com](https://aiolum.com/story/postiz/), citing TrustMRR): Nov 2025 $16.0k · Dec $15.8k · Jan 2026 $18.3k · Feb $46.0k · Mar $82.1k · Apr $93.0k · May $117.5k · Jun $152.0k · Jul $178.6k · Aug $192.6k · Sep $247.8k.

### Pricing and model
- **Cloud plans** ([postiz.com/pricing](https://postiz.com/pricing)):

  | Plan | Monthly | Yearly (per month) | Channels |
  |---|---|---|---|
  | Standard | $29 | $23 | 5 |
  | Team | $39 | $31 | 10 |
  | Pro | $49 | $39 | 30 |
  | Ultimate | $99 | $79 | 100 |

  Ultimate is marked "Popular". Every plan has a 7-day trial; there is no free tier. Self-hosting is free under AGPL.
- **ARPU** is about $33 to $34 ([X article](https://x.com/wickedguro/article/2090778859352563921), [systemaic](https://www.systemaic.com/teardowns/postiz)). He pushes yearly plans to protect margins and keep CAC below ARPU.

### Stars → money: the honest conversion
- At 15k stars and 584k Docker pulls he was making **about $2k/mo**. At 4.79M Docker pulls, **about $14k/mo**. Stars buy credibility and distribution; they don't pay you. In his words, stars are "not coins, contributors, or customers", and the path is "Community >> Product >> Money" ([star-history.com](https://star-history.com/blog/do-github-stars-equal-money)).
- At Novu, 99% of customers said they heard about it "from a friend" ([star-history.com](https://star-history.com/blog/do-github-stars-equal-money)).
- Open-source developers didn't pay. They contributed code, gave fast feedback and spread the name ([X article $100k](https://x.com/wickedguro/article/2055279858767552604)).
- The breakout came from targeting people who **automate** (n8n users, then AI agents) and from **selling outcomes**, for example "go viral on TikTok with automated slideshows", instead of selling "a scheduler" ([daily.dev summary of his talk](https://daily.dev/posts/the-marketing-playbook-behind-a-207k-month-saas-nevo-david-from-postiz-7w7e75jlr), [systemaic](https://www.systemaic.com/teardowns/postiz)).

### Traffic mix (third-party estimate, mid-2026)
- Direct 41.9%, organic search 38.6%, referral 9.9%, social 6.1%, paid 1.3%, generative AI 1.2%.
- Top referrers: GitHub 9.8%, AppSumo 8.2%, openalternative.co 2.8%.
- About 463k visits a month, with about 85.5k branded "postiz" searches.

Source: [systemaic](https://www.systemaic.com/teardowns/postiz).

---

## 2. His distribution tactics

### A. Open source as the top of the funnel
- **Lead with the repo.** The site and README are developer-first (dark theme, GitHub-centric). He deliberately avoided the marketers that Buffer and Sprout Social serve ([X article on idea picking](https://x.com/wickedguro/article/2090778859352563921)).
- **"Open-source alternative" directories and awesome-lists** for backlinks and discovery: Awesome OSS Alternatives, Awesome Self-hosted, OpenAlternative ([dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179)). openalternative.co alone is about 2.8% of referral traffic ([systemaic](https://www.systemaic.com/teardowns/postiz)).
- **GitHub Trending:** get "a lot of stars from multiple sources in a short period of time". Every article ends with a "give us a star" CTA. Organic only, never bought ([star-history.com](https://star-history.com/blog/do-github-stars-equal-money)). The launch was coordinated in a single week across GitHub, HN, r/selfhosted, Lemmy and dev.to/Medium/HackerNoon ([systemaic](https://www.systemaic.com/teardowns/postiz)).
- **Ship every minor feature as a release, then post the release.** Because it's open source, a new version counts as news, not an ad ([dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179), [Dan Raine](https://danraine.substack.com/p/he-gives-his-software-away-free-it)).

### B. Reddit and Lemmy cadence
- He posted to **r/selfhosted every 2 to 3 weeks**, and each post got **250k+ views**. Lemmy posts reliably got about 100 upvotes. "A few early upvotes from friends" tipped the algorithm ([X article $100k](https://x.com/wickedguro/article/2055279858767552604)).
- His best thread scored 1,629 upvotes. He also used r/SaaS and r/indiehackers ([systemaic](https://www.systemaic.com/teardowns/postiz)).
- He listened to Reddit: Docker support was built because Reddit asked for it ([dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179)).

### C. Product Hunt, repeated
- **Four PH launches**, each "won" with big outreach campaigns ([X article $100k](https://x.com/wickedguro/article/2055279858767552604)). Votes per launch: 1,179 (Nov 2024), 658 (Oct 2025), 551 (May 2026); each got fewer ([aiolum](https://aiolum.com/story/postiz/)).
- **How he gathered votes:** a social post asking for engagement, a PH badge in the README, asks in the newsletter and on Discord ([HackerNoon](https://hackernoon.com/this-open-source-marketing-hack-could-set-you-up-for-financial-freedom-in-2025)). Strong PH placement got picked up by newsletters ([Profitable Founder](https://floriandarroman.buzzsprout.com/2026218/episodes/18973966-i-made-46k-in-35-days-with-openclaw)).
- **Hacker News:** 9 Show HN posts. Eight scored under 20; the one timed with PH got 40+. Keep resubmitting until one sticks ([systemaic](https://www.systemaic.com/teardowns/postiz)).

### D. Ride the hype wave with an integration
- The sequence was n8n node → MCP server → OpenClaw skill → CLI (`npm i -g postiz`) → `skill.md` built from the API docs ([Profitable Founder](https://floriandarroman.buzzsprout.com/2026218/episodes/18973966-i-made-46k-in-35-days-with-openclaw), [X article $2M](https://x.com/wickedguro/article/2086788813301661865)).
- He says the n8n node took about an hour with an AI coding editor ([aiolum](https://aiolum.com/story/postiz/)).
- **Cold outreach to community owners.** He emailed n8n Skool communities, and that helped double MRR from $6.5k to $12.6k in a month ([dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179)).
- He watches X's trending sidebar and **publishes the same day a big release lands** ([Rob Hallam](https://robhallam.beehiiv.com/p/200-followers-7-2-million-views)).
- His quote: "My revenue just exploded once I started selling to agents" ([Mixergy](https://mixergy.com/interviews/revenue-jumped-when-he-sold-to-ai-agents/amp/)).

### E. The founder-led formats he uses on X, from his own "$2M ARR replicate" article ([link](https://x.com/wickedguro/article/2086788813301661865))

**What he says is losing effectiveness:** ads (CAC math), classic SEO ("people ask ChatGPT now"), company-page posts, and plain build-in-public ("big views, weak direct conversion").

**What he says works now:**
1. **Authority.** Post a real metric every day (Stripe link or TrustMRR, or a public DataFast/Plausible dashboard). He posts MRR almost daily. Examples:
   - "$145k MRR, +$1k/day" got [692k views](https://x.com/wickedguro/status/2072654822449586327).
   - The $3M ARR post got [1.05M views](https://x.com/wickedguro/status/2110347509948146070).
2. **X Articles.** X rewards saves and read time.
   - Turn your best tweet or video into an article.
   - Quote-repost it with a ~30-second video.
   - Write customer stories, or tell someone else's story when it's adjacent to your product.
   - Pay influencers to quote-repost with the **paid-partnership tag**. Without budget, re-share your own article.
   - His talk gives prices of about **$80 to $350 per quote-repost**, scheduled 5 to 15 minutes apart, an idea copied from Higgsfield ([daily.dev](https://daily.dev/posts/the-marketing-playbook-behind-a-207k-month-saas-nevo-david-from-postiz-7w7e75jlr)).
   - On the podcast he also mentioned paying small accounts (200 to 300 followers) to write articles ([Profitable Founder](https://floriandarroman.buzzsprout.com/2026218/episodes/18973966-i-made-46k-in-35-days-with-openclaw)).
3. **Tutorials that sell the outcome.** Viral how-to videos about the result your product enables (for Postiz: making money on social), with the product in the background.
4. **AEO (getting cited by AI answer engines).**
   - Ask ChatGPT about your category and see which sources it cites.
   - Plant genuinely helpful answers in those places (Reddit, LinkedIn articles, X articles, GitHub awesome-lists).
   - Pick a narrow niche so citations are easier to win.
5. **Lead magnets with "comment X to get Y".** Run them on Instagram and LinkedIn; he notes X prohibits automated comment-to-DM flows.
   - Point everything at one "source of truth" asset.
   - Warm up new accounts before posting.
6. **UGC and AI UGC.**
   - About $20 to $30 per creator video, 1 to 2 a day, across about 10 accounts. Keep going until one hits, then copy it.
   - He finds this cheaper per view than ads. His AI UGC comes from **agent-media**, his second startup.

He also uses **video-to-article repurposing** (Deepgram transcription → rewrite) for SEO ([systemaic](https://www.systemaic.com/teardowns/postiz)).

### F. Growth hacks he has described
- **Pitch for engagement.** His $3M ARR post asked people to *comment "BRAIN" and follow* to get a step-by-step tutorial ([X post](https://x.com/wickedguro/status/2110347509948146070)).
- **Affiliate program.** It "grew quickly", with users publishing about Postiz on their own ([dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179)).
- **Backlink swaps** through outreach emails ([dev.to](https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179)).
- **Conversion work without new traffic.** Show product value before the card form, put plans and payment on one page, fix churn. He claims one Jan 2026 change took MRR from $15k to $18k ([nevo.md](https://nevo.md/)).
- **Reliability as retention.** One failed post means churn. He moved from BullMQ to Temporal and added monitoring ([X article $100k](https://x.com/wickedguro/article/2055279858767552604)).
- **Stunts.** The staged code-"leak" feud got 400k+ views. He said: "I love stunts; I can't wait to make it again" ([X post](https://x.com/wickedguro/status/2114860154881552414), [Dan Raine](https://danraine.substack.com/p/he-gives-his-software-away-free-it)).
- **Gray-area tactics he admitted to.** Automated outreach on LinkedIn and Slack ([Profitable Founder](https://floriandarroman.buzzsprout.com/2026218/episodes/18973966-i-made-46k-in-35-days-with-openclaw)). Opening new Instagram accounts when old ones get banned ([X article $2M](https://x.com/wickedguro/article/2086788813301661865)). Dan Raine also documents several accounts posting near-identical "solo, no investors" praise within hours of the $3M post ([Dan Raine](https://danraine.substack.com/p/he-gives-his-software-away-free-it)).

  **Don't copy these.** They risk account bans, FTC/ASA disclosure problems and lost trust. A small account depends on credibility far more than he does.

### G. His strategic rules
These come from his idea-picking article ([link](https://x.com/wickedguro/article/2090778859352563921)):
- Pick an **existing, proven idea** and serve an **audience nobody serves**.
- A mid-tier SaaS has no technical moat, so marketing is the moat.
- **Check churn potential before building.** Marketing tools churn easily.
- Moats are found, not planned. His recurring ones are open source and agents.
- Niche down, but not so far that the market disappears.
- Keep CAC below ARPU.

---

## 3. The "brain": Nevo's Brain

**What it is.** A free remote MCP server at `https://mcp.nevo.md/mcp` (Streamable HTTP), launched Oct 14 2026 together with the $3M ARR announcement ([nevo.md](https://nevo.md/), [X post](https://x.com/wickedguro/status/2110347509948146070)). It works with Claude (web, desktop and Code), ChatGPT on paid plans, Cursor, Codex, Gemini CLI, OpenClaw and Hermes.

When you ask your agent about niches, channels, pricing, launches or conversion, the agent queries his playbooks and cites the source article or talk. The site sorts the playbooks into four sections:
- **Niche radar**
- **Hype antenna**
- **Tactics board**, which includes the Reddit playbook: "lead with the repo, post every release, repeat what works"
- **Growth engine**

The site also says "every play has a receipt", meaning it links each play to his revenue chart.

**Tools** ([mcp.nevo.md docs](https://mcp.nevo.md/)):
- `search_brain(query: 2–500 chars, limit: 1–10, default 6)` returns the best-matching passages with titles and source links.
- `list_sources()` lists every article, talk and interview in the brain.

Both are read-only. Limits are 60 tool calls per minute per account.

**Auth, and the actual business purpose.** There is no API key. Sign-in is OAuth 2.1 with PKCE: you enter your email, then a 6-digit code, then click Allow. **Signing in subscribes you to his newsletter** ([mcp.nevo.md](https://mcp.nevo.md/), [nevo.md](https://nevo.md/)). So the Brain is:
1. a lead magnet that captures email from people who build with AI agents (his exact ICP),
2. a way to make his content the "answer" that AI tools give, which is AEO by another route, and
3. a viral launch asset: 1.05M views and 1,048 bookmarks on the announcement.

**Code.** [github.com/gitroomhq/nevomd](https://github.com/gitroomhq/nevomd) is public. It looks like Astro + TypeScript, deployed on Railway, with Playwright tests and a `PLAN.md`; it had 2 stars when I checked. The README and license weren't visible, so check before forking.

**How a founder can use it today:**
```
claude mcp add --transport http nevos-brain https://mcp.nevo.md/mcp
```
Then ask it things like "Find me a niche", "My trial-to-paid is 8%. What do I fix first?", or "Give me a launch plan for an AI audio SaaS for non-native English speakers."

**How to build your own "brain":**
1. Collect your corpus: every post, X article, thread, podcast transcript and changelog, chunked and tagged by topic.
2. Put it behind a tiny MCP server with two read-only tools, `search_<yourbrand>` (embedding or BM25 search returning passages plus source URLs) and `list_sources`.
3. Gate it with email OAuth: the email becomes a newsletter subscriber.
4. Announce it with a demo video. Ask people to reply with a keyword (doing it by hand on X is fine; automated DMs are not), then send the link.
5. Keep feeding it. Every new post adds content, and the brain stays a reason to subscribe.

**AudioBet version:** a "Speak Clean Brain" covering pronunciation, filler-word, delivery and demo-video scripting tips for founders and non-native speakers. More valuable still: a **product MCP/CLI that agents call to clean a voice track**. See section 5.

---

## 4. Other X-first playbooks for a ~3k-follower builder audience

| Playbook | Example with numbers | What to copy |
|---|---|---|
| **Small account + X Article on a trending topic** | Oliver Henry, about 200 followers. His article on an OpenClaw agent posting TikToks via Postiz got about 7.2M views. Postiz went from $21k to $118k/mo in the next three months ([Rob Hallam](https://robhallam.beehiiv.com/p/200-followers-7-2-million-views)). His own Larry results: 500k+ TikTok views in under a week, 108 subscribers, about $588 MRR across two apps ([Postiz blog](https://postiz.com/blog/ai-agent-tiktok-views-postiz-api)) | X distributes by **interest, not follower count**. Write the definitive how-to the day a trend breaks, with your product as one step in the workflow. |
| **Verified-revenue build in public** | Nevo's daily MRR posts: 79k, 692k and 1.05M views ([1](https://x.com/wickedguro/article/2055279858767552604), [2](https://x.com/wickedguro/status/2072654822449586327), [3](https://x.com/wickedguro/status/2110347509948146070)). In mid-2026 he had only about 7.9k followers ([systemaic](https://www.systemaic.com/teardowns/postiz)); today he has 26.7k | Connect Stripe to TrustMRR on day 1. Post the number even at $0. Pair it with one lesson per post. |
| **Ship fast, launch on X + PH** | Marc Lou's TrustMRR: $1k MRR about 52 minutes after launch, about $8k in 24h, about 35k visits in 24 to 48h, mostly from selling homepage ad slots ([developmentcorporate](https://developmentcorporate.com/?p=6647), [yespress](https://yespress.io/marc-lou)) **(secondary sources)** | Build a launch around your audience's existing pain (verifying revenue), and monetize on day 1. |
| **The MVP tweet is the launch** | Tony Dinh's TypingMind: MVP tweeted within about 6 days, **$10k in about 10 days**, about $22k within a week of PH. "Twitter was his entire marketing strategy. That and Product Hunt." $500k in about a year ([indieai summary](https://indieai.pages.dev/blog/tony-dinh-2026-typingmind-devutils-indie-playbook), [IH](https://www.indiehackers.com/post/how-a-tool-that-improves-the-ui-for-chatgpt-reached-10k-mo-only-a-few-months-after-launch-5e69b67949)) **(secondary)** | Ship the smallest usable thing and post a screen-recording demo. Charge from the start. |
| **Affiliates + free tools (AI video for creators, closest analog to AudioBet)** | Submagic: $1M ARR about 3 months after its first customer, $8M ARR by Jun 2025, $0 raised. Affiliates started 30 days in at **30% lifetime** commission and now number 10k+, driving about 20% of ARR. One founder video: 100k views → $3k MRR. Free tools peaked at about 9M visits/mo. **A YouTube downloader drew traffic but didn't convert. A video compressor did, because it relates to the core product.** First 100 customers went into a WhatsApp group ([superframeworks](https://superframeworks.com/case-study/submagic), [Latka](https://getlatka.com/interviews/submagic-david-zitoun-2025)) | Launch affiliates by day 30. Every free tool must be one step before the paid product. |
| **Reply-guy** | Self-reported cases: 342 → 8k followers in 90 days at 15 to 20 targeted replies a day ([replyengine](https://replyengine.pages.dev/blog/ai-reply-strategies/reply-first-growth-strategy), vendor blog). An agency estimates 10 to 100 followers a day depending on volume ([innmind](https://blog.innmind.com/x-growth-playbook-for-startup-founders-2026/)). Counterpoint: one 17k-follower founder says 95% of growth came from viral tweets, 5% from replies **(all unverified)** | Pick 30 to 40 target accounts (creator-economy, indie-hacker and ESL-teacher accounts) and post 15 to 20 *useful* replies a day, ideally a 10-second before/after clip. Use replies for reach and articles for conversion. |
| **Comment-to-get lead magnet** | Nevo's "comment BRAIN" post: 324 replies, 1.05M views ([X post](https://x.com/wickedguro/status/2110347509948146070)) | On X, send the link by hand, in replies or DMs. Automate only on Instagram and LinkedIn. |

---

## 5. Translating it to AudioBet

Working idea: upload a demo or talking-head video; AI removes ums and stumbles and re-voices it in your cloned voice.

### Positioning (following Nevo's rules)
- **Existing, proven demand.** Descript (filler-word removal + Overdub), Cleanvoice, Adobe Podcast Enhance and Captions already show people want this. Don't invent a category.
- **Underserved audience.** Descript serves podcasters and editors. Serve **indie founders shipping demo videos** and **non-native English speakers** who are judged on fluency rather than ideas. Sell the outcome: "Sound fluent in your own voice" or "Record once, sound like take 10". Don't sell "an audio editor".
- **Agent angle, the move that made Postiz.** Agents now produce videos: Larry, agent-media, Remotion/HyperFrames pipelines, AI UGC. Ship a **CLI + MCP + skill.md** so an agent can run `audiobet clean demo.mp4 --revoice` as one step in its pipeline. Then write the X article "How my agent ships founder demos with zero retakes."
- **Churn warning (Nevo's ceiling rule).** One-off cleanup jobs churn. Build retention in from the start: a weekly content habit, a stored voice model, API usage by agents, and annual plans.
- **Consent and safety.** Voice cloning must be locked to the account owner's own voice: a live read-a-sentence verification, plus a watermark or disclosure option. This protects the brand, and you can post about it as a trust feature.

### Open-source angle: yes, partially
- Open-source the **filler-word detector and cutter**, e.g. `umless`: a CLI using Whisper word timestamps + ffmpeg that removes ums, long pauses and restarts, plus a self-host Docker image.
- Keep the **re-voice with your cloned voice** step in the cloud, since it costs GPU money and carries consent and safety obligations. Nevo's line was charging "only for cloud costs"; yours is "the free CLI cuts, the cloud re-voices".
- Payoff: r/selfhosted, r/LocalLLaMA and Show HN become places you can post releases as news; awesome-lists and OpenAlternative give backlinks and AEO citations; GitHub Trending is possible.
- Position it as an "open-source alternative to Descript's filler-word removal".

### Free tool / lead magnet
**"Um Counter"** at `/um`. No signup. Upload up to 60 seconds and get:
1. **A Fluency Score card**: um count, words per minute, longest pause, a shareable image with a "my score is 87, beat it" CTA. This is the viral loop on X.
2. **A free cut-only cleaned preview**, watermarked.
3. **"Hear it re-voiced in your own voice"** gated by email: send the full 60-second re-voiced file to the user's inbox.

All three feed directly into the paid product, which is the Submagic lesson. Secondary tools for SEO: filler-word remover, speaking-pace calculator, script-to-teleprompter, video compressor.

### Email capture points
- Um Counter result
- The Brain-style MCP sign-in, if you build one
- A "Demo Video Script Pack" PDF (10 founder demo scripts)
- An exit-intent waitlist before launch
- Pricing page trial

Use one newsletter for all of them: a weekly "Fluent Founder" with a build-in-public MRR line, one teardown of a great founder demo, and one feature.

---

## 6. 60-day X-first GTM checklist (AudioBet)

**Throughout all 60 days:**
- 1 metric post a day: TrustMRR or Stripe MRR, or "minutes cleaned" before revenue.
- 15 to 20 targeted replies a day, each with a short before/after clip when relevant.
- 1 before/after video every 2 days.
- Reddit/Lemmy release posts every 2 to 3 weeks, once the open-source repo exists.

### Days 1–7: Foundations
- [ ] Narrow the ICP to two segments: (a) indie founders recording demos, (b) non-native English creators. Write one outcome line for each.
- [ ] Landing page with a 20-second before/after audio toggle above the fold, a waitlist, and email capture.
- [ ] Stripe connected to **TrustMRR** from day 1. Add a public analytics dashboard (DataFast or Plausible).
- [ ] Pin a "Building AudioBet in public" thread on X: problem, a 30-second raw-vs-clean demo, and the waitlist link.
- [ ] Install Nevo's Brain (`claude mcp add --transport http nevos-brain https://mcp.nevo.md/mcp`). Ask it for niche and launch critiques and post the answers as content.
- [ ] Build the reply-target list: 40 accounts across creator economy, build-in-public, ESL/English teaching and AI video tools.
- [ ] Draft the voice-clone consent and safety policy.

### Days 8–21: Free tool + open-source repo
- [ ] Ship **Um Counter** (no signup; score card plus email-gated re-voice sample). Launch it on X with a demo video and run fluency-score challenges.
- [ ] Ship the open-source **`umless` CLI + Docker** with a meme-able README. Add a star CTA in every post and article.
- [ ] Single-week open-source push: GitHub + Show HN + r/selfhosted / r/LocalLLaMA / r/SideProject (follow each sub's rules) + Lemmy + dev.to/Hashnode article "How I built an open-source um remover with Whisper + ffmpeg". Ask friends for early upvotes and stars on the same day; real engagement only.
- [ ] Submit to awesome-selfhosted, Awesome OSS Alternatives, OpenAlternative and AlternativeTo (as an alternative to Descript or Cleanvoice).
- [ ] Recruit 20 to 50 beta users from waitlist and replies. Put them in a WhatsApp or Discord group, Submagic-style, and collect before/after testimonials with permission.
- [ ] Write X Article #1: "I analyzed 100 founder demo videos — the average one has N ums per minute." Use real data from Um Counter. Quote-repost it with a 30-second clip.

### Days 22–35: Pre-launch
- [ ] Paid beta at an early-bird price, e.g. $19/mo or $149/yr, with yearly plans pushed. A 7-day trial with the paywall *after* the user hears their re-voiced clip.
- [ ] Ship the **agent interface**: `npm i -g audiobet` CLI, an MCP server, and a `skill.md` from the API docs. Submit to MCP and skill directories.
- [ ] Write X Article #2, the agent tutorial: "My Claude Code agent now ships my product demos with zero retakes." Publish on the day of a relevant trending AI video or voice release.
- [ ] Customer stories: three short videos from non-native speakers with before and after (with consent).
- [ ] Start the affiliate program at 30% lifetime (FirstPromoter or Rewardful) and invite beta users and creators.
- [ ] Line up 5 to 10 creators for launch-day quote-reposts. If paid, they must use the **paid-partnership tag**. No fake accounts.
- [ ] Prepare Product Hunt: hunter or self-hunt, gallery made of before/after clips, maker comment, a 45 to 60-second demo where the voice-over itself is cleaned by AudioBet. Build the supporter list from email, DMs and community.
- [ ] Pre-launch directories: BetaList, Uneed, Peerlist and Microlaunch upcoming pages.

### Day ~36: Launch day (Tue or Wed)
- [ ] **00:01 PT:** Product Hunt goes live. Post the maker comment.
- [ ] **00:05:** X launch post with a 60-second raw → clean demo, the PH link in a reply, and the TrustMRR link for credibility.
- [ ] **00:10:** Email the waitlist and beta users with "We're live" and the PH link. DM every beta user personally.
- [ ] **06:00–09:00 PT:** Show HN (CLI/OSS angle), Indie Hackers post, r/SideProject, LinkedIn post with a "comment DEMO to get the founder script pack" lead magnet.
- [ ] **Every 1 to 2 hours:** quote-repost with new before/after clips. Partner quote-reposts spaced 15 to 30 minutes apart. Reply to every comment within 10 minutes.
- [ ] **Midday:** publish X Article #3, the launch story ("I built an AI that makes non-native founders sound fluent — day-1 numbers"). Quote it with video.
- [ ] **Evening:** a TrustMRR screenshot post with the real day-1 MRR.
- [ ] **Day +1:** a lessons thread.

### Days 37–60: Compounding
- [ ] Directory blitz (about 2 a day): Uneed, Peerlist Launchpad, Microlaunch, Fazier, TinyLaunch, DevHunt (CLI), There's An AI For That, Futurepedia, Toolify, SaaSHub, AlternativeTo, TrustMRR listing, Indie Hackers products.
- [ ] Reddit/Lemmy release posts every 2 to 3 weeks with real version news, e.g. "umless v0.3: detects false starts".
- [ ] One X Article a week. Turn the best-performing tweet or video into the article, then quote-repost it with a 30-second video.
- [ ] Ride every trend on the same day: new voice or TTS model drops, new agent frameworks. Post "AudioBet now works inside X" with a demo.
- [ ] UGC test: 1 to 2 creator videos a day at about $20 to $30 each, about 30 days, across a few accounts (LinkedIn, TikTok, Reels). Scale whatever hits. Target non-native English creators.
- [ ] AEO: ask ChatGPT and Perplexity "how to remove ums from video" or "sound fluent in English video". Answer helpfully where they cite (Reddit threads, awesome-lists, LinkedIn articles).
- [ ] Cold-email 20 community owners: Skool or Discord groups for YouTubers, ESL creators, and founder communities. Offer an affiliate deal plus a free workshop. This is the move that doubled Nevo's MRR.
- [ ] Conversion work: show the user's re-voiced clip before the card form, put plans and payment on one page, nudge annual plans, and run churn exit surveys.
- [ ] Day 60 review: CAC versus ARPU for each channel. Double down on the top two and drop the rest.

**Targets to track:** Um Counter uses → email capture rate → trial → paid; MRR on TrustMRR; trial-to-paid; month-1 churn; stars; X Article views and bookmarks.

---

## Sources opened
- https://trustmrr.com/startup/postiz
- https://nevo.md/
- https://mcp.nevo.md/
- https://github.com/gitroomhq/nevomd
- https://dev.to/nevodavid/i-did-it-my-open-source-company-now-makes-142k-monthly-as-a-single-developer-1179
- https://hackernoon.com/this-open-source-marketing-hack-could-set-you-up-for-financial-freedom-in-2025
- https://dev.to/crowddotdev/how-to-grow-a-github-project-to-20k-stars-with-nevo-david-novu-3i81
- https://star-history.com/blog/do-github-stars-equal-money
- https://danraine.substack.com/p/he-gives-his-software-away-free-it
- https://aiolum.com/story/postiz/
- https://www.systemaic.com/teardowns/postiz
- https://www.arr.club/postiz/postiz-reaches-80k-mrr
- https://daily.dev/posts/the-marketing-playbook-behind-a-207k-month-saas-nevo-david-from-postiz-7w7e75jlr
- https://floriandarroman.buzzsprout.com/2026218/episodes/18973966-i-made-46k-in-35-days-with-openclaw
- https://mixergy.com/interviews/revenue-jumped-when-he-sold-to-ai-agents/amp/
- https://postiz.com/pricing
- https://postiz.com/tools
- https://postiz.com/blog/ai-agent-tiktok-views-postiz-api
- https://robhallam.beehiiv.com/p/200-followers-7-2-million-views
- X posts and articles by @wickedguro, read via api.fxtwitter.com:
  - [2110347509948146070](https://x.com/wickedguro/status/2110347509948146070) ($3M ARR + Brain)
  - [2086788813301661865](https://x.com/wickedguro/article/2086788813301661865) ($2M ARR replicate)
  - [2090778859352563921](https://x.com/wickedguro/article/2090778859352563921) (idea picking)
  - [2055279858767552604](https://x.com/wickedguro/article/2055279858767552604) ($100k MRR)
  - [2072654822449586327](https://x.com/wickedguro/status/2072654822449586327) ($145k MRR)
  - [2112240445187031273](https://x.com/wickedguro/status/2112240445187031273) (Linvo)
  - [2114860154881552414](https://x.com/wickedguro/status/2114860154881552414) (stunt)
  - [2114702046050054344](https://x.com/wickedguro/status/2114702046050054344) (contractor reply)
- https://superframeworks.com/case-study/submagic
- From search results only, not opened: developmentcorporate.com / yespress.io (Marc Lou), indieai.pages.dev (Tony Dinh), replyengine / innmind (reply-guy), getlatka (Submagic). These are secondary and marked as such above.
- Could not open (403 or blocked): Indie Hackers "1.3M ARR" post, Medium post, YouTube talk page (only the title loaded).
