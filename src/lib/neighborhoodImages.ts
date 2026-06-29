export interface NeighborhoodImage {
  src: string;
  alt: string;
  credit: string;
  license: string;
  sourceUrl: string;
}

const IMAGES: Record<string, NeighborhoodImage> = {
  "403": {
    src: "/images/neighborhoods/403.jpg",
    alt: "Roosevelt Avenue commercial strip, Jackson Heights, Queens — storefronts and transit infrastructure",
    credit: "Tenzin Youdon",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Jackson_Heights,_Queens_NY.jpg",
  },
  "404": {
    src: "/images/neighborhoods/404.jpg",
    alt: "Produce vendors at Corona Farmers Market, Corona Plaza, Queens",
    credit: "Preston Keres / USDA Office of Communications",
    license: "Public Domain (US Government work)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Produce_at_Corona_Farmers_Market_in_Queens,_New_York_20180817-OC-PJK-1651_(42333313980).jpg",
  },
  "407": {
    src: "/images/neighborhoods/407.jpg",
    alt: "Pedestrians and storefronts at Main Street and Roosevelt Avenue, Flushing, Queens",
    credit: "Chad Davis",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Chinatown_1.jpg",
  },
  "410": {
    src: "/images/neighborhoods/410.jpg",
    alt: "Sutter Avenue at 128th Street, South Ozone Park, Queens",
    credit: "RightCowLeftCoast",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:South_Ozone_Park.jpg",
  },
  "412": {
    src: "/images/neighborhoods/412.jpg",
    alt: "Bus terminal and street scene, Downtown Jamaica, Queens transit hub",
    credit: "David Shankbone",
    license: "CC BY 2.5",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Jamaica,_Queens_by_David_Shankbone.jpg",
  },
  "112": {
    src: "/images/neighborhoods/112.jpg",
    alt: "Broadway at 187th Street, Washington Heights — buses, storefronts, uptown street life",
    credit: "Petri Krohn",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Washington_Heights_from_east_along_187th.jpg",
  },
  "110": {
    src: "/images/neighborhoods/110.jpg",
    alt: "125th Street, Harlem — shops, yellow cab, and pedestrians on the main commercial corridor",
    credit: "Phil Whitehouse",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:125th_Street_-_Harlem_(2114353135).jpg",
  },
  "103": {
    src: "/images/neighborhoods/103.jpg",
    alt: "Allen Street at Houston Street, Lower East Side, Manhattan — urban street corner",
    credit: "Ken Lund",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Allen_Street_and_Houston_Street,_Lower_East_Side_Manhattan,_New_York_(7237382820).jpg",
  },
  "201": {
    src: "/images/neighborhoods/201.jpg",
    alt: "East 139th Street facing east, Mott Haven, South Bronx — residential and commercial corridor",
    credit: "Amolina196",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:East_139th_Street.jpg",
  },
  "205": {
    src: "/images/neighborhoods/205.jpg",
    alt: "Fruit vendor on East Fordham Road, the Bronx — street market life",
    credit: "Kenneth C. Zirkel",
    license: "CC BY 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Fruit_vendor_on_East_Fordham_Road,_the_Bronx.jpg",
  },
  "303": {
    src: "/images/neighborhoods/303.jpg",
    alt: "Hart Street at Marcus Garvey Boulevard, Bed-Stuy, Brooklyn — row houses and neighborhood mural",
    credit: "Andre Carrotflower",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Bed-Stuy_20191130_-_07_-_Hart_@_Marcus_Garvey.jpg",
  },
  "308": {
    src: "/images/neighborhoods/308.jpg",
    alt: "West Indian American Day Parade on Eastern Parkway, Crown Heights, Brooklyn",
    credit: "Brian Lin",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:West_Indian_Day_Parade_2009-_Brooklyn,_NYC-32.jpg",
  },
  "316": {
    src: "/images/neighborhoods/316.jpg",
    alt: "Street market on Belmont Avenue, Brownsville, Brooklyn (1962) — outdoor vendors and crowds",
    credit: "Roger Higgins, World-Telegram & Sun",
    license: "Public Domain (Library of Congress, no known copyright restrictions)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Street_market_-_Brownsville_-_1962.jpg",
  },
};

export function neighborhoodImage(boroCd: string): NeighborhoodImage | null {
  return IMAGES[boroCd] ?? null;
}

export const ALL_NEIGHBORHOOD_IMAGES: Record<string, NeighborhoodImage> = IMAGES;
