import { BeforeAfter } from "@/components/BeforeAfter";
import { PlanButton } from "@/components/PlanButton";
import { SavingsCalc } from "@/components/SavingsCalc";
import { Waitlist } from "@/components/Waitlist";

const faq = [
  ["How is this different from Descript?", "Descript is a full editor you have to learn. Umless is one button: upload, get the clean version back. No timeline, no transcript editing. It also catches retakes (\"sorry, let me say that again\") that filler-word removers miss."],
  ["Will it sound like me?", "Clean Cut keeps your real voice and only removes the mistakes. Re-voice re-records your polished script in your own voice, learned from the same video. The voice sample is sent with each request and never stored, by us or anyone else."],
  ["I'm not a native English speaker. Will it work?", "Yes. That's who built it, and who it's for. Umless understands accented English and dozens of other languages, and Re-voice fixes grammar slips before re-recording."],
  ["Is it really open source?", "The cutting engine and CLI go on GitHub at launch, MIT licensed. Bring your own OpenRouter key and it costs about 2 cents per 3-minute video. The hosted app is for people who'd rather not touch a terminal, and it adds your own voice, Studio Sound and the Mac app."],
  ["What can I upload?", "Screen-recorded demos, Loom-style walkthroughs, talking-head videos, podcasts and voice notes. MP4, MOV, MP3, M4A and WAV, up to 10 minutes during early access."],
  ["How long does it take?", "About a minute for a 3-minute video."],
  ["Do you keep my videos?", "No. Files are deleted 24 hours after processing."],
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Umless",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web, macOS",
      description: "Removes ums, stutters, retakes and dead air from videos, and can re-record speech in your own voice.",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Open source" },
        { "@type": "Offer", price: "19", priceCurrency: "USD", name: "Creator" },
        { "@type": "Offer", price: "39", priceCurrency: "USD", name: "Pro" },
        { "@type": "Offer", price: "99", priceCurrency: "USD", name: "Team" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
};

export default function Home() {
  return (
    <div className="landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero">
        <span className="pill">Early access · founding prices locked for life</span>
        <h1 className="display">
          Sound like you nailed it
          <br />
          in one take.
        </h1>
        <p className="lead">
          Upload your demo or talking video. Umless cuts every um, stutter, retake and dead pause, and can re-record your script in your own voice. No editor. No timeline.
        </p>
        <div className="hero-form">
          <Waitlist source="hero" cta="Get early access" />
        </div>
        <p className="small muted">
          Or <a href="/um-score">get your free Um Score</a> right now. No signup.
        </p>
      </section>

      <BeforeAfter />

      <section className="band">
        <div className="band-item"><b>12 takes</b><span>is what a 2-minute demo usually costs</span></div>
        <div className="band-item"><b>~1 min</b><span>to clean a 3-minute video</span></div>
        <div className="band-item"><b>0</b><span>timelines to learn</span></div>
      </section>

      <section id="how">
        <p className="eyebrow">How it works</p>
        <h2>Record once. Post the clean one.</h2>
        <div className="steps3">
          <div><span className="num">1</span><h3>Upload the messy take</h3><p className="muted">MP4, MOV or audio. Screen recordings, talking heads, voice notes.</p></div>
          <div><span className="num">2</span><h3>Umless reads every word</h3><p className="muted">It finds ums, stutters, false starts, &ldquo;let me say that again&rdquo; and dead air, and shows you each cut.</p></div>
          <div><span className="num">3</span><h3>Download and post</h3><p className="muted">Same video, same voice, zero stumbles. Or re-voiced from a polished script.</p></div>
        </div>
      </section>

      <section>
        <p className="eyebrow">Three ways to fix a take</p>
        <h2>Pick how clean you want it.</h2>
        <div className="features">
          <div className="feature">
            <span className="tag">Clean Cut</span>
            <h3>Your real voice, minus the mistakes</h3>
            <p className="muted">Cuts ums, uhs, stutters, restarts and long pauses with invisible crossfades. Nothing else is touched.</p>
          </div>
          <div className="feature">
            <span className="tag">Studio Sound</span>
            <h3>Laptop mic in, podcast mic out</h3>
            <p className="muted">Removes hum, fan noise and room rumble, then levels your voice to streaming loudness.</p>
          </div>
          <div className="feature hot">
            <span className="tag hot">Re-voice</span>
            <h3>Your script, re-recorded in your voice</h3>
            <p className="muted">Polishes grammar and flow, re-records every line in your own voice, and syncs it to your screen recording.</p>
          </div>
        </div>
      </section>

      <section>
        <p className="eyebrow">Who it&apos;s for</p>
        <h2>You know your product. Your takes don&apos;t show it.</h2>
        <div className="grid">
          <div className="card"><h3>Founders shipping demos</h3><p className="muted">Your launch video is your first impression. Stop losing an evening to retakes for a 2-minute demo.</p></div>
          <div className="card"><h3>Non-native English speakers</h3><p className="muted">Don&apos;t let ums and grammar slips make you sound less sure than you are. Umless was built by one of us.</p></div>
          <div className="card"><h3>Creators &amp; course makers</h3><p className="muted">Batch-record, upload, post. Umless does the cutting that eats half your editing time.</p></div>
        </div>
      </section>

      <section>
        <p className="eyebrow">Time is the price you&apos;re already paying</p>
        <h2>What do retakes cost you?</h2>
        <SavingsCalc />
      </section>

      <section id="open-source" className="oss">
        <div>
          <p className="eyebrow">For builders</p>
          <h2>Open source engine. Hosted when you&apos;d rather not.</h2>
          <p className="muted">
            The cutting engine and CLI are going on GitHub at launch, MIT licensed. Bring your own OpenRouter key and a 3-minute video costs about 2 cents. Run it in CI, wire it into your agent, fork it.
          </p>
          <p className="muted">The hosted app adds what&apos;s hard to self-host: your own voice ready to go, Studio Sound, a Mac app, and nothing to install.</p>
        </div>
        <pre className="code">
          <code>
            {`$ npx umless launch-demo.mp4

Um Score 26/100 · 13.7 ums/min · 13 stutters & retakes
Um, so hi everyone. Uh, today I'm gonna, I'm gonna show…

✓ launch-demo.umless.mp4  39.4s → 16.9s`}
          </code>
        </pre>
      </section>

      <section id="pricing">
        <p className="eyebrow">Pricing</p>
        <h2>Founding prices, locked for life.</h2>
        <p className="muted">Join the waitlist now and you keep today&apos;s price even after it goes up.</p>
        <div className="plans">
          <div className="plan">
            <h3>Open source</h3>
            <div className="price">$0</div>
            <p className="muted small">Bring your own key. About $0.02 per video.</p>
            <PlanButton plan="oss" ghost>Get notified at launch</PlanButton>
            <ul className="ticks"><li>Clean Cut from your terminal</li><li>Um Score</li><li>MIT license</li><li>You set up the keys</li></ul>
          </div>
          <div className="plan">
            <h3>Creator</h3>
            <div className="price">$19<small>/mo</small></div>
            <p className="muted small">For people who post every week.</p>
            <PlanButton plan="creator" ghost>Lock $19/mo</PlanButton>
            <ul className="ticks"><li>120 minutes a month</li><li>Clean Cut + Studio Sound</li><li>Your real voice</li><li>Or $12 for a single video</li></ul>
          </div>
          <div className="plan pop">
            <h3>Pro <span className="tag hot">Most popular</span></h3>
            <div className="price">$39<small>/mo</small></div>
            <p className="muted small">Never re-record a line again.</p>
            <PlanButton plan="pro">Lock $39/mo</PlanButton>
            <ul className="ticks"><li>Everything in Creator</li><li>Re-voice in your own voice</li><li>Script polish (grammar + flow)</li><li>Pro voices</li><li>Mac app at launch</li></ul>
          </div>
          <div className="plan">
            <h3>Team</h3>
            <div className="price">$99<small>/mo</small></div>
            <p className="muted small">For startups and agencies.</p>
            <PlanButton plan="team" ghost>Lock $99/mo</PlanButton>
            <ul className="ticks"><li>5 seats, 500 minutes</li><li>API, CLI &amp; MCP for your agents</li><li>Shared voices</li><li>Priority support</li></ul>
          </div>
        </div>
      </section>

      <section className="coming">
        <p className="eyebrow">Coming soon</p>
        <h2>Umless, wherever you record.</h2>
        <div className="grid">
          <div className="card"><span className="tag">Mac app</span><h3>Drop a file, get it back clean</h3><p className="muted">Lives in your menu bar. Drag a recording on it, done.</p></div>
          <div className="card"><span className="tag">iPhone</span><h3>Clean clips before you post</h3><p className="muted">Fix a talking-head clip on your phone, straight from Photos.</p></div>
          <div className="card"><span className="tag">Agents</span><h3>Claude Code skill &amp; MCP</h3><p className="muted">Let your agent clean every demo it records. One line to install.</p></div>
        </div>
      </section>

      <section id="waitlist" className="wl-card">
        <h2>Get early access</h2>
        <p className="muted">Founding spots open in small batches. Tell us what you record and we&apos;ll build your version first.</p>
        <Waitlist source="landing" showPlan />
      </section>

      <section>
        <h2>Questions</h2>
        {faq.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p className="muted">{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
