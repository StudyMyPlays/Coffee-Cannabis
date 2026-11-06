"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import { COPY } from "@/lib/site";

export function HeroCta() {
  return (
    <>
      <Link href="#join" className="btn" onClick={() => track("cta_click", { cta: "join_hero" })}>
        {COPY.ctaJoin}
      </Link>
      <Link href="#gathering" className="btn btn--ghost" onClick={() => track("cta_click", { cta: "next_gathering_hero" })}>
        {COPY.ctaNext}
      </Link>
    </>
  );
}
