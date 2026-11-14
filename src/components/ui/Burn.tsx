/** The brief's burn reveal: characters fade in from a blur, staggered. Screen readers get the plain text. */
export function Burn({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, w, words) => {
          const offset = words.slice(0, w).join(" ").length + (w ? 1 : 0);
          return (
            <span key={w} className="inline-block whitespace-nowrap">
              {[...word].map((ch, i) => (
                <span key={i} className="burn__char" style={{ ["--i" as string]: offset + i }}>
                  {ch}
                </span>
              ))}
              {w < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
    </>
  );
}
