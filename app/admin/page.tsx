// Private funnel dashboard: /admin?key=ADMIN_KEY&days=7
import type { Metadata } from "next";
import { advice, funnel, loadEvents, loadWaitlist, maskEmail, pct, STAGE_LABELS, STAGES } from "@/lib/track";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Umless admin", robots: { index: false, follow: false } };

type SP = Promise<{ key?: string; days?: string }>;

function allowed(key?: string) {
  const want = process.env.ADMIN_KEY;
  if (want) return key === want;
  return process.env.NODE_ENV !== "production";
}

function Spark({ daily }: { daily: { date: string; visitors: number; joins: number }[] }) {
  if (!daily.length) return <p className="muted small">No data yet.</p>;
  const W = 640, H = 120, P = 4;
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  const step = daily.length > 1 ? (W - 2 * P) / (daily.length - 1) : 0;
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = daily.map((d, i) => `${P + i * step},${y(d.visitors)}`).join(" ");
  const bw = Math.max(3, Math.min(16, step * 0.5 || 16));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Daily visitors and waitlist joins">
      {daily.map((d, i) => (
        <rect key={d.date} x={P + i * step - bw / 2} y={y(d.joins)} width={bw} height={H - P - y(d.joins)} fill="var(--good)" opacity="0.7">
          <title>{`${d.date}: ${d.joins} joins`}</title>
        </rect>
      ))}
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      {daily.map((d, i) => (
        <circle key={d.date} cx={P + i * step} cy={y(d.visitors)} r="3" fill="var(--accent)">
          <title>{`${d.date}: ${d.visitors} visitors`}</title>
        </circle>
      ))}
    </svg>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--line)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

export default async function Admin({ searchParams }: { searchParams: SP }) {
  const { key, days: d } = await searchParams;
  if (!allowed(key)) return <main><h1>Not found</h1></main>;
  const days = [1, 7, 30, 90].includes(Number(d)) ? Number(d) : 7;
  const [all, waitlist] = await Promise.all([loadEvents(), loadWaitlist()]);
  const cutoff = Date.now() - days * 86400_000;
  const events = all.filter((e) => Date.parse(e.ts) >= cutoff);
  const f = funnel(events, all);
  const todo = advice(f);
  const joinsInWindow = waitlist.filter((w) => w.at && Date.parse(w.at) >= cutoff).length;
  const q = (n: number) => `?days=${n}${key ? `&key=${encodeURIComponent(key)}` : ""}`;

  return (
    <main>
      <h1 style={{ fontSize: 36, marginTop: 24 }}>Funnel</h1>
      <div className="row">
        {[1, 7, 30, 90].map((n) => (
          <a key={n} href={q(n)} className={`tag${n === days ? " hot" : ""}`} style={{ textDecoration: "none" }}>
            {n === 1 ? "24h" : `${n} days`}
          </a>
        ))}
        <span className="muted small">{events.length} events · {waitlist.length} on waitlist total · {joinsInWindow} joined in window</span>
      </div>

      <div className="card" style={{ marginTop: 20, borderColor: "var(--accent)" }}>
        <h3>What to do next</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {todo.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>

      <h2 style={{ marginTop: 40 }}>Stages</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {STAGES.map((s, i) => (
          <div key={s} className="card" style={{ padding: 14 }}>
            <div className="small muted">{STAGE_LABELS[s]}</div>
            <div className="stat" style={{ fontSize: 32 }}>{f.total[s]}</div>
            <div className="small muted">{i === 0 ? "unique visitors" : `${pct(f.total[s], f.total[STAGES[i - 1]])}% of prev`}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 40 }}>Daily</h2>
      <p className="small muted" style={{ marginTop: 0 }}>Line: visitors. Bars: waitlist joins.</p>
      <div className="card"><Spark daily={f.daily} /></div>

      <h2 style={{ marginTop: 40 }}>By source (first touch)</h2>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 15 }}>
          <thead>
            <tr>
              <th style={th}>Source</th>
              {STAGES.map((s) => <th key={s} style={th}>{STAGE_LABELS[s]}</th>)}
              <th style={th}>Visit→join</th>
              <th style={th}>Visit→paid</th>
            </tr>
          </thead>
          <tbody>
            {f.bySource.length === 0 && (
              <tr><td style={td} colSpan={STAGES.length + 3} className="muted">No visits yet. Share links with ?s=your-code.</td></tr>
            )}
            {f.bySource.map(({ source, counts }) => (
              <tr key={source}>
                <td style={{ ...td, fontWeight: 700 }}>{source}</td>
                {STAGES.map((s) => <td key={s} style={td}>{counts[s]}</td>)}
                <td style={td}>{pct(counts.waitlist_join, counts.visit)}%</td>
                <td style={td}>{pct(counts.paid, counts.visit)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 40 }}>Latest waitlist</h2>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 15 }}>
          <thead>
            <tr>
              {["When", "Email", "Plan", "Source", "Score", "Answers"].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {waitlist.length === 0 && <tr><td style={td} colSpan={6} className="muted">Nobody yet.</td></tr>}
            {waitlist.slice(-30).reverse().map((w, i) => {
              const extra = Object.entries(w)
                .filter(([k, v]) => !["email", "plan", "source", "score", "at", "vid", "ref"].includes(k) && v !== "" && v != null)
                .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                .join(" · ");
              return (
                <tr key={i}>
                  <td style={td}>{w.at ? new Date(w.at).toISOString().slice(0, 16).replace("T", " ") : ""}</td>
                  <td style={td}>{maskEmail(w.email)}</td>
                  <td style={td}>{w.plan || ""}</td>
                  <td style={td}>{w.source || ""}</td>
                  <td style={td}>{w.score ?? ""}</td>
                  <td style={{ ...td, whiteSpace: "normal", minWidth: 200 }} className="small">{extra}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
