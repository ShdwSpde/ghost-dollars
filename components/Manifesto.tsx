import { neighborhoodImage } from "@/src/lib/neighborhoodImages";

// Three neighborhoods that represent the map's geographic scope
const COLLAGE: Array<{ cd: string; short: string }> = [
  { cd: "403", short: "Jackson Heights, Queens" },
  { cd: "110", short: "Harlem, Manhattan" },
  { cd: "303", short: "Bed-Stuy, Brooklyn" },
];

export function Manifesto() {
  const photos = COLLAGE.map(({ cd, short }) => {
    const img = neighborhoodImage(cd);
    return img ? { cd, short, img } : null;
  }).filter(Boolean) as Array<{ cd: string; short: string; img: NonNullable<ReturnType<typeof neighborhoodImage>> }>;

  return (
    <section className="manifesto" aria-label="Project lede">
      {/* Decorative color-block architecture */}
      <div className="manifesto-blocks" aria-hidden="true">
        <span className="m-blk1" />
        <span className="m-blk2" />
        <span className="m-blk3" />
      </div>

      <div className="manifesto-inner">
        <div className="manifesto-content">
          {/* Visual masthead — aria-hidden because header h1 already names the page */}
          <div className="manifesto-masthead" aria-hidden="true">
            <span className="m-ghost">Ghost</span>
            <span className="m-dollars">Dollars</span>
          </div>

          <h2 className="manifesto-heading" id="manifesto-heading">
            A people&rsquo;s map of the money New York won&rsquo;t show you.
          </h2>

          <div className="manifesto-rule" aria-hidden="true" />

          <div className="manifesto-body">
            <p className="manifesto-para">
              Every New Yorker is owed an equal share of the city&rsquo;s capital
              budget — the spending that fixes streets, funds parks, and rebuilds
              schools.{" "}<strong>Ghost dollars</strong>{" "}are what a neighborhood
              didn&rsquo;t receive: the gap between what arrived and what
              parity says it was owed.
            </p>

            <p className="manifesto-para">
              The books are broken in two compounding ways. Nearly{" "}
              <strong>three-quarters of all city capital spending</strong>{" "}names no
              neighborhood at all — the dollars exist but cannot be placed on a
              map. And the NYC Comptroller found separately that nearly{" "}
              <strong>half of all capital projects</strong>{" "}are missing from
              published data entirely. Not delayed. Not relocated. Simply absent
              from the record.
            </p>

            <p className="manifesto-para">
              This map starts in working-class, immigrant Queens — Jackson Heights,
              Corona, Flushing, Jamaica, South Ozone Park — then opens onto
              Harlem, the South Bronx, Bed-Stuy, and all 59 community districts
              across the city.
            </p>
          </div>

          <a
            href="#explorer"
            className="manifesto-cta"
            aria-label="Find your neighborhood — jump to the district explorer"
          >
            Find your neighborhood. See what it&rsquo;s owed.
            <span className="manifesto-cta-arrow" aria-hidden="true"> →</span>
          </a>
        </div>

        {/* Poster photo collage — three duotone neighborhoods */}
        {photos.length > 0 && (
          <div className="manifesto-photos" aria-hidden="true">
            {photos.map(({ cd, short, img }) => (
              <div key={cd} className="manifesto-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="eager"
                  decoding="async"
                />
                <p className="manifesto-photo-label">{short}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="manifesto-scroll-cue" aria-hidden="true">
        Scroll to see the evidence
      </p>
    </section>
  );
}
