"use client";
import { useState } from "react";
export function Caveat({ message, locked, source }: { message: string; locked: boolean; source?: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="caveat" role="note">
      <p>{message}{source && <span className="src"> — {source}</span>}</p>
      {!locked && <button onClick={()=>setHidden(true)} aria-label="Dismiss">Dismiss</button>}
    </div>
  );
}
