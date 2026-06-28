"use client";
import { useEffect, useRef, useState } from "react";
import { useAtlas } from "./AtlasProvider";
import { MapPanel } from "./MapPanel";
import { INTRO_STEPS } from "@/src/lib/introSteps";

const METRIC_LABEL: Record<string, string> = {
  actual: "Actual capital $",
  perResident: "Per-resident $",
  ghost: "Ghost $ vs parity",
};

export function IntroScroll() {
  const { setSelectedCd, setMetric } = useAtlas();
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            setActive(i);
            setSelectedCd(INTRO_STEPS[i].boroCd);
            setMetric(INTRO_STEPS[i].metric);
          }
      },
      { threshold: 0.6 }
    );
    refs.current.forEach((r) => r && obs.observe(r));
    return () => obs.disconnect();
  }, [setSelectedCd, setMetric]);

  const step = INTRO_STEPS[active];

  return (
    <section className="scrolly" aria-label="Corridor walkthrough">
      <div className="scrolly-stage">
        <div className="scrolly-map">
          <MapPanel />
        </div>
        <div className="scrolly-caption mono" aria-live="polite">
          {step.headline} · {METRIC_LABEL[step.metric]}
        </div>
      </div>
      <div className="scrolly-beats">
        {INTRO_STEPS.map((s, i) => (
          <section
            key={s.boroCd}
            data-i={i}
            data-active={active === i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="intro-beat"
          >
            <p className="beat-tag">Stop {i + 1} of {INTRO_STEPS.length}</p>
            <h2>{s.headline}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </section>
  );
}
