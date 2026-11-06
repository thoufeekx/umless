"use client";
// The hero product frame: one real take, three versions, and the transcript showing exactly what was cut.
import { useState } from "react";
import { track } from "@/components/Track";

const TABS = [
  { id: "before", label: "Before", src: "/demo/before.mp4", poster: "/demo/before.jpg", meta: "39s · 9 ums · 1 retake" },
  { id: "cut", label: "Clean Cut", src: "/demo/after-cut.mp4", poster: "/demo/after-cut.jpg", meta: "17s · your real voice, zero ums" },
  { id: "revoice", label: "Re-voice", src: "/demo/after-revoice.mp4", poster: "/demo/after-revoice.jpg", meta: "17s · polished script, same voice" },
] as const;

// Output of the real pipeline on this take: [word] = cut.
const TAKE =
  "[Um,] so hi everyone. [Uh,] today [I'm] [gonna,] I'm gonna show you my app. So basically, [um,] [you,] [uh,] you upload your video here and then, [uh,] [the,] the AI, [um,] it finds all [the,] like, the mistakes. [Uh,] [Sorry,] [let] [me,] [let] [me] [say] [that] [again.] It removes the ums and the long pauses. And, [um,] you get a clean video back. [Uh,] yeah. That's it. Thanks.";

export function BeforeAfter() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("before");
  const t = TABS.find((x) => x.id === tab)!;
  return (
    <div className="frame">
      <div className="frame-bar">
        <span className="dots"><i /><i /><i /></span>
        <div className="tabs" role="tablist">
          {TABS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              className={tab === x.id ? "tab on" : "tab"}
              onClick={() => {
                setTab(x.id);
                track("demo_tab", { tab: x.id });
              }}
            >
              {x.label}
            </button>
          ))}
        </div>
        <span className="frame-meta">{t.meta}</span>
      </div>
      <video key={t.src} src={t.src} poster={t.poster} controls playsInline preload="metadata" />
      <p className="take transcript">
        {TAKE.split(" ").map((w, i) =>
          w.startsWith("[") ? <s key={i}>{w.slice(1, -1)}</s> : <span key={i}>{w} </span>,
        )}
      </p>
    </div>
  );
}
