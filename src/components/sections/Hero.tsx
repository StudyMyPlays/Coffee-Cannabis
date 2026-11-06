import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import { CCMark } from "@/components/ui/CCMark";
import { PaisleyCorner, PaisleyGlyph } from "@/components/paisley";
import { COPY } from "@/lib/site";
import { fmtShortDate, pad2 } from "@/lib/format";
import type { PublicGathering } from "@/lib/data/types";
import { HeroCta } from "./HeroCta";
import styles from "./Hero.module.css";

export function Hero({ next }: { next: PublicGathering | null }) {
  const nextLine = next ? `Gathering No. ${pad2(next.number)} · ${fmtShortDate(next.startsAtUtc)}` : "Next gathering announced soon";
  const where = next ? ` · ${next.neighborhood ?? "Neighborhood TBA"}` : "";

  return (
    <section className={styles.hero} data-hero aria-labelledby="hero-title">
      <div className={styles.bg} data-hero-bg aria-hidden="true">
        <BrandImage name="hero-field" alt="" sizes="100vw" priority quality={90} />
      </div>
      <div className={styles.veil} aria-hidden="true" />

      <div className={styles.drift} aria-hidden="true">
        <PaisleyGlyph className={`${styles.glyphA} drift`} />
        <PaisleyGlyph className={`${styles.glyphB} drift drift--slow`} />
      </div>

      {/* Supplied bandana frame (manifest: paisley-border), tinted gold via mask. */}
      <div className={styles.bandana} aria-hidden="true" />

      <div className={styles.frame} data-hero-frame aria-hidden="true">
        <span className={`${styles.rule} ${styles.ruleTop}`} data-hero-rule />
        <span className={`${styles.rule} ${styles.ruleBottom}`} data-hero-rule />
        <span className={`${styles.rule} ${styles.ruleLeft}`} data-hero-rule />
        <span className={`${styles.rule} ${styles.ruleRight}`} data-hero-rule />
        <PaisleyCorner position="tl" className={`${styles.corner} ${styles.tl}`} />
        <PaisleyCorner position="tr" className={`${styles.corner} ${styles.tr}`} />
        <PaisleyCorner position="bl" className={`${styles.corner} ${styles.bl}`} />
        <PaisleyCorner position="br" className={`${styles.corner} ${styles.br}`} />
      </div>

      <div className={styles.content} data-hero-content>
        <div data-hero-intro style={{ "--i": 0 } as React.CSSProperties}>
          <CCMark className={styles.mark} />
        </div>
        <p className={`eyebrow ${styles.eyebrow}`} data-hero-intro style={{ "--i": 1 } as React.CSSProperties}>
          A members club for Los Angeles · 21+
        </p>
        <h1 id="hero-title" className={`display ${styles.title}`} data-hero-intro style={{ "--i": 2 } as React.CSSProperties}>
          Find your <em>people.</em>
        </h1>
        <p className={styles.support} data-hero-intro style={{ "--i": 3 } as React.CSSProperties}>
          {COPY.heroSupport}
        </p>
        <div className={styles.ctas} data-hero-intro style={{ "--i": 4 } as React.CSSProperties}>
          <HeroCta />
        </div>
      </div>

      <Link href="#gathering" className={styles.ticker} data-hero-intro style={{ "--i": 5 } as React.CSSProperties}>
        <span className={styles.pulse} aria-hidden="true" />
        <span>
          {nextLine}
          {where && <span className={styles.where}>{where}</span>}
        </span>
        <span aria-hidden="true" className={styles.arrow}>↓</span>
      </Link>
    </section>
  );
}
