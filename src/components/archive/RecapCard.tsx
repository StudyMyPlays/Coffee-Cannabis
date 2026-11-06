import Image from "next/image";
import Link from "next/link";
import { fmtDateYear, pad2 } from "@/lib/format";
import type { PublicGathering } from "@/lib/data/types";
import styles from "./RecapCard.module.css";

/** Archive card for a past gathering: photo, number, date, quote, drink, playlist. */
export function RecapCard({ g, drinkName }: { g: PublicGathering; drinkName?: string | null }) {
  const photo = g.recap?.photos[0];
  const quote = g.recap?.quotes[0];
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {photo ? (
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 30vw, 90vw" style={{ objectFit: "cover" }} />
        ) : (
          <span className={styles.numeral} aria-hidden="true">
            {pad2(g.number)}
          </span>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.meta}>
          No. {pad2(g.number)} · {fmtDateYear(g.startsAtUtc)}
          {g.neighborhood ? ` · ${g.neighborhood}` : ""}
        </p>
        <h3 className={styles.title}>
          <Link href={`/gatherings/${g.slug}`}>{g.title}</Link>
        </h3>
        {g.recap?.summary && <p className={styles.summary}>{g.recap.summary}</p>}
        {quote && (
          <blockquote className={styles.quote}>
            <p>&ldquo;{quote.text}&rdquo;</p>
            <footer>— {quote.name}</footer>
          </blockquote>
        )}
        <ul className={styles.extras}>
          {drinkName && <li>Drink of the gathering: {drinkName}</li>}
          {g.recap?.playlistUrl && (
            <li>
              <a href={g.recap.playlistUrl} target="_blank" rel="noopener noreferrer">
                The playlist ↗
              </a>
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}
