"use client";
// Email box for the hosted free try. Remembered locally so a returning visitor doesn't retype it.
import { useEffect } from "react";
import { TRY } from "@/components/useJob";

export const EMAIL_OK = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(e.trim());

export function TryEmail({ email, setEmail }: { email: string; setEmail: (e: string) => void }) {
  useEffect(() => {
    if (TRY) setEmail(localStorage.getItem("umless_email") || "");
  }, [setEmail]);
  if (!TRY) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          localStorage.setItem("umless_email", e.target.value.trim());
        }}
        aria-label="Your email"
        style={{ padding: "10px 12px", width: "100%", maxWidth: 340, borderRadius: 8, border: "1px solid var(--line, #ccc)" }}
      />
      <p className="small muted" style={{ margin: "6px 0 0" }}>
        Free try: 1 clip per day, up to 10 minutes and 200 MB. Your email joins the Umless list; unsubscribe any time. Files are deleted after 24 hours.
      </p>
    </div>
  );
}
