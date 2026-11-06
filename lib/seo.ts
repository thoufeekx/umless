// Programmatic SEO pages, one per search term people actually type (from research/demand.md).
export type SeoPage = {
  slug: string;
  title: string;
  h1: string;
  intro: string;
  pain: string;
  steps: [string, string][];
  faq: [string, string][];
};

const upload: [string, string] = ["Upload", "Drop your MP4, MOV, MP3 or M4A. Up to 10 minutes."];

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "remove-filler-words-from-video",
    title: "Remove filler words from video online (free preview)",
    h1: "Remove filler words from your video, automatically",
    intro: "Umless finds every um, uh, stutter and restart in your video and cuts them out. No editor, no timeline. You see every cut before you pay.",
    pain: "Removing filler words by hand means scrubbing the timeline for every \"um\". A 3-minute video can take an hour. Most people give up and post the messy take.",
    steps: [upload, ["We find the fillers", "Ums, uhs, repeated words, false starts and \"let me say that again\" retakes."], ["Download the clean take", "Same video, same voice, zero filler words."]],
    faq: [
      ["Is it free?", "Your Um Score and the full list of cuts are free. Downloading the cleaned video is part of the paid plans, from $12 for a single video."],
      ["Does it catch more than ums?", "Yes. It also catches stutters (\"I'm gonna, I'm gonna\"), false starts and retakes, which most filler-word removers miss."],
      ["Which languages?", "English with any accent, plus dozens of other languages."],
    ],
  },
  {
    slug: "remove-ums-from-video",
    title: "Remove ums from video in one click",
    h1: "Remove the ums from your video in one click",
    intro: "Upload a video and get it back without the ums, uhs and awkward pauses. Your voice, just more confident.",
    pain: "Every \"um\" makes you sound less sure than you are. Viewers notice, and they drop off.",
    steps: [upload, ["See your Um Score", "How many ums per minute, plus every one we'll remove."], ["Get the clean version", "Ums cut, pauses tightened, nothing else touched."]],
    faq: [
      ["Will the cuts be noticeable?", "Cuts are made between words with tiny crossfades, and pauses are shortened rather than deleted, so it still sounds natural."],
      ["Can I use it for podcasts?", "Yes. Audio files work the same way."],
    ],
  },
  {
    slug: "remove-silence-from-video",
    title: "Remove silence and dead air from video automatically",
    h1: "Remove silence and dead air from your video",
    intro: "Umless shortens long pauses and trims dead air at the start and end, so your video moves at a confident pace.",
    pain: "Silence removers that only look at volume chop off words and breaths. Umless reads the words, so it knows where a pause really is.",
    steps: [upload, ["We read every word", "Word-level timing tells us which pauses are dead air and which are natural."], ["Download", "Pauses trimmed to a natural length. No chopped-off words."]],
    faq: [["Do you delete all pauses?", "No. Long pauses are shortened to a natural quarter-second, so it doesn't sound robotic."]],
  },
  {
    slug: "descript-alternative",
    title: "Descript alternative for removing filler words (no editor)",
    h1: "The Descript alternative for people who don't want to edit",
    intro: "Descript is powerful, but it's a whole editor to learn. Umless does one job: upload a messy take, get a clean one back.",
    pain: "If all you want is to remove ums and retakes from a demo, learning a timeline editor is overkill. And re-recording a line in your voice needs setup and credits.",
    steps: [upload, ["One click", "Fillers, stutters, retakes and dead air removed automatically."], ["Optional re-voice", "Re-record the polished script in your own cloned voice, synced to your screen."]],
    faq: [
      ["Is Umless cheaper than Descript?", "Umless starts at $19/month, or $12 for a single video, with no editor to learn."],
      ["Can I edit the transcript?", "Not yet. Umless is built to be one-click. If you need detailed editing, Descript is great."],
    ],
  },
  {
    slug: "replace-voice-in-video-with-my-voice",
    title: "Re-record your video's voiceover in your own AI voice",
    h1: "Re-record your voiceover in your own voice, without re-recording",
    intro: "Umless learns your voice from the video itself, polishes your script, and re-records it: same voice, no stumbles. Your voice is never stored.",
    pain: "Re-recording a 3-minute voiceover means 10 takes and an evening gone. And every product update means doing it again.",
    steps: [upload, ["We polish the script", "Grammar fixed, fillers gone, meaning untouched."], ["Re-voiced in your voice", "Synced to your screen recording, ready to post."]],
    faq: [["Do you keep my voice?", "No. A short sample of your voice is sent with each request and never stored, by us or anyone else."]],
  },
  {
    slug: "video-accent-clarity",
    title: "Sound clearer in English videos: AI accent clarity for creators",
    h1: "Sound as clear as you think, in every video",
    intro: "For non-native English speakers: Umless removes the ums and stumbles, fixes grammar slips in your script, and can re-record it in a clear, confident voice.",
    pain: "You know your product better than anyone. But ums, restarts and grammar slips make you sound less sure than you are.",
    steps: [upload, ["Script polish", "We fix grammar and flow while keeping your words."], ["Clear re-voice", "Your own voice or a pro voice, synced to your video."]],
    faq: [["Will it erase my accent?", "Clean Cut keeps your real voice. Re-voice re-records your script, which usually sounds clearer. You choose."]],
  },
];

export const seoPage = (slug: string) => SEO_PAGES.find((p) => p.slug === slug);
