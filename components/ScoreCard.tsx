"use client";
import { useEffect, useRef } from "react";

type Stats = { score: number; fillerCount: number; fillersPerMin: number; deadAirSec: number; repeatCount: number; retakeCount: number; topFillers: [string, number][] };

// Draws a 1200x675 share card (X's large image size) people can post: "My Um Score is 62".
export function ScoreCard({ stats, duration }: { stats: Stats; duration: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    const W = 1200;
    const H = 675;
    g.fillStyle = "#16140f";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#ff4d2e";
    g.fillRect(0, 0, 18, H);
    g.fillStyle = "#a39c8e";
    g.font = "600 34px -apple-system, Inter, sans-serif";
    g.fillText("MY UM SCORE", 80, 110);
    g.fillStyle = "#f3efe6";
    g.font = "800 260px -apple-system, Inter, sans-serif";
    g.fillText(String(stats.score), 66, 360);
    const scoreW = g.measureText(String(stats.score)).width;
    g.fillStyle = "#a39c8e";
    g.font = "600 40px -apple-system, Inter, sans-serif";
    g.fillText("/ 100", 90 + scoreW, 360);
    const verdict = stats.score >= 85 ? "Smooth operator." : stats.score >= 65 ? "Pretty clean. A few ums." : stats.score >= 40 ? "The ums are winning." : "Um... we need to talk.";
    g.fillStyle = "#ff4d2e";
    g.font = "700 46px -apple-system, Inter, sans-serif";
    g.fillText(verdict, 80, 450);
    const top = stats.topFillers[0]?.[0] ? `Favourite filler: "${stats.topFillers[0][0]}"` : "No favourite filler";
    const lines = [
      `${stats.fillersPerMin} ums per minute · ${stats.fillerCount} in ${Math.round(duration)}s`,
      `${stats.repeatCount + stats.retakeCount} stutters & retakes · ${stats.deadAirSec}s of dead air`,
      top,
    ];
    g.fillStyle = "#f3efe6";
    g.font = "500 32px -apple-system, Inter, sans-serif";
    lines.forEach((l, i) => g.fillText(l, 80, 530 + i * 44));
    g.fillStyle = "#a39c8e";
    g.font = "700 30px -apple-system, Inter, sans-serif";
    const brand = "umless · get yours free";
    g.fillText(brand, W - 80 - g.measureText(brand).width, 110);
  }, [stats, duration]);

  function download() {
    const a = document.createElement("a");
    a.download = `my-um-score-${stats.score}.png`;
    a.href = ref.current!.toDataURL("image/png");
    a.click();
  }

  const tweet = encodeURIComponent(
    `My Um Score is ${stats.score}/100 😬\n${stats.fillersPerMin} ums per minute in my last video.\n\nWhat's yours? Free, no signup:`,
  );

  return (
    <div>
      <canvas ref={ref} width={1200} height={675} />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={download}>Download card</button>
        <a className="btn ghost" target="_blank" rel="noreferrer" href={`https://x.com/intent/post?text=${tweet}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin + "/um-score" : "")}`}>
          Post it on X
        </a>
      </div>
    </div>
  );
}
