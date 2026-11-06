import { SITE_URL } from "./config";

/** Brand-level site constants and approved copy (verbatim from the brief). */
export const SITE = {
  name: "Coffee & Cannabis Club",
  url: SITE_URL,
  description:
    "Coffee & Cannabis Club brings Los Angeles together through exceptional drinks, intimate gatherings and a new kind of community.",
} as const;

export const COPY = {
  heroHeadline: "Find your people.",
  heroSupport:
    "Coffee & Cannabis Club brings Los Angeles together through exceptional drinks, intimate gatherings and a new kind of community.",
  ctaJoin: "Join the club",
  ctaNext: "Next gathering",
  why: [
    "Los Angeles can feel enormous and strangely disconnected.",
    "We are creating a place to actually meet people.",
  ],
  ritual: "Come for the ritual. Stay for the people.",
  community: "Come alone. Leave knowing somebody.",
  clubhouse: "A club before there’s a clubhouse.",
  first1000: "The first 1,000 build the culture.",
  goodDrinks: "Good drinks. Good energy. People worth meeting.",
  archiveEmpty: "The story starts here.",
} as const;

/** Founding member cap shown in the Founding Members + Join sections. */
export const FOUNDING_CAP = 1000;
