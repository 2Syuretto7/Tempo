"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A board with its prompt (top) and its actions (bottom). See `.stage` in globals.css:
 * stacked on narrow screens, side by side on wide ones.
 */
export function Stage({ board, top, bottom, focusKey }: { board?: ReactNode; top: ReactNode; bottom?: ReactNode; focusKey?: unknown }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  // When feedback appears below the board on a small screen, bring it into view.
  useEffect(() => {
    if (!focusKey || !bottomRef.current) return;
    const el = bottomRef.current;
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight) el.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [focusKey]);
  return (
    <div className={board ? "stage" : "stage stage--plain"}>
      <div className="stage__grid">
        <div className="stage__top">{top}</div>
        {board && <div className="stage__board">{board}</div>}
        <div className="stage__bottom" ref={bottomRef}>
          {bottom}
        </div>
      </div>
    </div>
  );
}
