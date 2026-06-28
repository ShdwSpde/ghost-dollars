"use client";
import { useEffect, useRef } from "react";
import { useAtlas } from "./AtlasProvider";
import { INTRO_STEPS } from "@/src/lib/introSteps";
export function IntroScroll() {
  const { setSelectedCd, setMetric } = useAtlas();
  const refs = useRef<(HTMLElement|null)[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        const i = Number((e.target as HTMLElement).dataset.i);
        setSelectedCd(INTRO_STEPS[i].boroCd); setMetric(INTRO_STEPS[i].metric);
      }
    }, { threshold: 0.6 });
    refs.current.forEach((r)=>r && obs.observe(r));
    return () => obs.disconnect();
  }, [setSelectedCd, setMetric]);
  return (
    <div className="intro">
      {INTRO_STEPS.map((s, i) => (
        <section key={s.boroCd} data-i={i} ref={(el)=>{refs.current[i]=el;}} className="intro-beat">
          <h2>{s.headline}</h2><p>{s.body}</p>
        </section>
      ))}
    </div>
  );
}
