"use client";
// Pricing buttons: record the plan they chose, then hand it to the waitlist form below.
import { track } from "@/components/Track";

export function PlanButton({ plan, children, ghost }: { plan: string; children: React.ReactNode; ghost?: boolean }) {
  return (
    <a
      href="#waitlist"
      className={ghost ? "btn ghost wide" : "btn wide"}
      onClick={() => {
        track("checkout_click", { plan });
        window.dispatchEvent(new CustomEvent("umless:plan", { detail: plan }));
      }}
    >
      {children}
    </a>
  );
}
