"use client";
// Two-step waitlist: email first (one field = most signups), then 30 seconds of questions that tell us
// who they are and what they'd pay, then a referral link that moves them up the line.
import { useEffect, useState } from "react";
import { track } from "@/components/Track";

const PLANS: [string, string][] = [
  ["creator", "Creator · $19/mo"],
  ["pro", "Pro · $39/mo (your voice)"],
  ["team", "Team · $99/mo"],
  ["oss", "Open source (BYO key)"],
];

const Q = {
  role: ["Founder / indie hacker", "Developer", "Creator / YouTuber", "Course or coach", "Marketer", "Podcaster", "Other"],
  records: ["Product demos", "Talking-head videos", "Tutorials / courses", "Podcasts", "Sales / Loom videos", "Social clips"],
  frequency: ["Every day", "Every week", "Every month", "Rarely"],
  pain: ["Ums and stutters", "Too many retakes", "My accent / grammar", "Editing takes hours", "Bad mic / noisy room", "I hate my voice"],
  price: ["$0, I'd use the open-source CLI", "$12 per video", "$19/mo", "$39/mo", "$99/mo for my team"],
  apps: ["Mac app", "iPhone app", "Claude Code / agent skill", "Chrome extension"],
};

type Joined = { id: string; code: string; position: number; total: number; referrals: number };

function Chips({ options, value, onChange, multi }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  return (
    <div className="chips">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            className={on ? "chip on" : "chip"}
            aria-pressed={on}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : on ? [] : [o])}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Waitlist({
  source,
  plan: fixedPlan,
  score,
  cta = "Join the waitlist",
  showPlan = false,
}: {
  source: string;
  plan?: string;
  score?: number;
  cta?: string;
  showPlan?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState(fixedPlan || "pro");
  const [state, setState] = useState<"idle" | "sending" | "questions" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [joined, setJoined] = useState<Joined | null>(null);
  const [a, setA] = useState<Record<string, string[]>>({});
  const [x, setX] = useState("");
  const [copied, setCopied] = useState(false);

  // A plan picked from a pricing card follows the visitor down to the form.
  useEffect(() => {
    const onPick = (e: Event) => setPlan((e as CustomEvent<string>).detail);
    window.addEventListener("umless:plan", onPick);
    return () => window.removeEventListener("umless:plan", onPick);
  }, []);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    let ref: string | null = null;
    try {
      ref = new URLSearchParams(location.search).get("ref") || localStorage.getItem("umless_ref");
    } catch {}
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan, source, score, ref }),
    });
    const j = await res.json();
    if (!res.ok) {
      setState("error");
      setMsg(j.error);
      return;
    }
    track("waitlist_join", { source, plan });
    setJoined(j);
    setState("questions");
  }

  async function answer(e: React.FormEvent) {
    e.preventDefault();
    if (!joined) return;
    const res = await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: joined.id, answers: { ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, k === "records" || k === "apps" || k === "pain" ? v : v[0]])), x } }),
    });
    if (res.ok) setJoined({ ...joined, ...(await res.json()) });
    track("waitlist_answers", { role: a.role?.[0] ?? "", price: a.price?.[0] ?? "" });
    setState("done");
  }

  if (state === "questions" && joined)
    return (
      <form onSubmit={answer} className="qs">
        <p className="qs-head">
          <strong>You&apos;re in, #{joined.position}.</strong> Six quick taps so we build your version first.
        </p>
        <label>I&apos;m a…</label>
        <Chips options={Q.role} value={a.role || []} onChange={(v) => setA({ ...a, role: v })} />
        <label>I record… (pick any)</label>
        <Chips multi options={Q.records} value={a.records || []} onChange={(v) => setA({ ...a, records: v })} />
        <label>How often?</label>
        <Chips options={Q.frequency} value={a.frequency || []} onChange={(v) => setA({ ...a, frequency: v })} />
        <label>What hurts most? (pick any)</label>
        <Chips multi options={Q.pain} value={a.pain || []} onChange={(v) => setA({ ...a, pain: v })} />
        <label>What would you honestly pay?</label>
        <Chips options={Q.price} value={a.price || []} onChange={(v) => setA({ ...a, price: v })} />
        <label>Want it as… (pick any)</label>
        <Chips multi options={Q.apps} value={a.apps || []} onChange={(v) => setA({ ...a, apps: v })} />
        <label htmlFor="xh">Your X handle (optional, so we can say thanks)</label>
        <input id="xh" type="text" placeholder="@you" value={x} onChange={(e) => setX(e.target.value)} />
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn">Save my answers</button>
          <button type="button" className="linkish" onClick={() => setState("done")}>Skip</button>
        </div>
      </form>
    );

  if (state === "done" && joined) {
    const link = typeof window !== "undefined" ? `${location.origin}/?ref=${joined.code}` : `/?ref=${joined.code}`;
    const tweet = `I just joined the @umless waitlist. It cuts the ums, stutters and retakes out of your videos, and can re-record your script in your own voice.\n\n${link}`;
    return (
      <div className="done">
        <p className="done-pos">#{joined.position}</p>
        <p>
          <strong>You&apos;re on the list, and today&apos;s price is locked for life.</strong> Every friend who joins with your link moves you up 5 spots
          {joined.referrals ? ` (${joined.referrals} so far)` : ""}.
        </p>
        <div className="row">
          <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your referral link" />
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              navigator.clipboard?.writeText(link).catch(() => {});
              setCopied(true);
              track("referral_copy");
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a className="btn" href={`https://x.com/intent/post?text=${encodeURIComponent(tweet)}`} target="_blank" rel="noreferrer" onClick={() => track("referral_share", { to: "x" })}>
            Share on X
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={join} className="wl">
      <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
      {showPlan && !fixedPlan && (
        <select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plan">
          {PLANS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      )}
      <button className="btn" disabled={state === "sending"}>{state === "sending" ? "Joining…" : cta}</button>
      {state === "error" && <span className="small err">{msg}</span>}
    </form>
  );
}
