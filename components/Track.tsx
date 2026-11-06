"use client";
// First-party analytics: <Track /> once in the layout, track("event", {...}) anywhere else.
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const FT_KEY = "umless_ft";
const ATTR = ["s", "utm_source", "utm_medium", "utm_campaign"] as const;

type Props = Record<string, string | number | boolean | null>;

export function track(event: string, props?: Props, extra?: Record<string, string | undefined>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ event, path: location.pathname, props, ...extra });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", body)) return;
  } catch {
    // fall through to fetch
  }
  fetch("/api/track", { method: "POST", body, keepalive: true, credentials: "same-origin" }).catch(() => {});
}

// Current ?s= / utm params, else the first-touch ones we saved on an earlier visit.
function attribution() {
  const q = new URLSearchParams(location.search);
  const now: Record<string, string> = {};
  for (const k of ATTR) {
    const v = q.get(k);
    if (v) now[k] = v;
  }
  let ref = "";
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    if (host && host !== location.hostname) ref = host;
  } catch {}
  if (ref) now.ref = ref;
  let first: Record<string, string> = {};
  try {
    first = JSON.parse(localStorage.getItem(FT_KEY) || "{}");
    if (Object.keys(now).length && !Object.keys(first).length) localStorage.setItem(FT_KEY, JSON.stringify(now));
  } catch {}
  const a = Object.keys(now).length ? now : first;
  return { src: a.s, utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign, ref: a.ref };
}

export default function Track() {
  const pathname = usePathname();

  useEffect(() => {
    track("visit", undefined, attribution());
  }, [pathname]);

  useEffect(() => {
    let done = false;
    try {
      done = sessionStorage.getItem("umless_engaged") === "1";
    } catch {}
    if (done) return;
    const fire = (how: string) => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem("umless_engaged", "1");
      } catch {}
      track("engaged", { how });
      cleanup();
    };
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + innerHeight) / h.scrollHeight >= 0.5) fire("scroll");
    };
    const timer = setTimeout(() => fire("time"), 20000);
    addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => {
      clearTimeout(timer);
      removeEventListener("scroll", onScroll);
    };
    return cleanup;
  }, []);

  return null;
}
