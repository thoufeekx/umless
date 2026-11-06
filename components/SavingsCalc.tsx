"use client";
// "Saves time or money": shows what re-recording and editing costs today.
import { useState } from "react";

export function SavingsCalc() {
  const [videos, setVideos] = useState(8);
  const [mins, setMins] = useState(45);
  const [rate, setRate] = useState(50);
  // Umless leaves ~5 minutes of review per video.
  const hours = Math.max(0, (videos * (mins - 5)) / 60);
  const money = Math.round(hours * rate);
  const row = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, unit: string) => (
    <label className="calc-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} />
      <b>{unit === "$" ? `$${v}` : `${v} ${unit}`}</b>
    </label>
  );
  return (
    <div className="calc">
      <div>
        {row("Videos you make a month", videos, setVideos, 1, 40, 1, "")}
        {row("Minutes you spend re-recording and cutting each one", mins, setMins, 10, 180, 5, "min")}
        {row("What an hour of your time is worth", rate, setRate, 10, 200, 5, "$")}
      </div>
      <div className="calc-out">
        <div className="stat">{hours.toFixed(hours < 10 ? 1 : 0)}h</div>
        <div className="muted small">back every month</div>
        <div className="stat" style={{ marginTop: 16 }}>${money.toLocaleString()}</div>
        <div className="muted small">of your time, for a $39 plan</div>
      </div>
    </div>
  );
}
