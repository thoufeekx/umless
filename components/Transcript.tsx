// Shows the transcript with everything we cut struck through, so people see exactly what changed.
export function Transcript({ words }: { words: { text: string; cut?: string }[] }) {
  return (
    <p className="transcript">
      {words.map((w, i) =>
        w.cut ? (
          <s key={i} title={w.cut}>
            {w.text}
          </s>
        ) : (
          <span key={i}>{w.text} </span>
        ),
      )}
    </p>
  );
}
