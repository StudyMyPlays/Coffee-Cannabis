import { BrandImage } from "@/components/ui/BrandImage";
import type { ImageName } from "@/lib/images";
import { COPY } from "@/lib/site";
import styles from "./Community.module.css";

const PHOTOS: { name: ImageName; alt: string; speed: string; cls: string }[] = [
  { name: "community-table", alt: "Strangers sharing a long communal table, mid-conversation", speed: "0.08", cls: "a" },
  { name: "community-arrival", alt: "A guest arriving alone and being welcomed at the door", speed: "0.22", cls: "b" },
  { name: "community-dj", alt: "A DJ playing to a small, relaxed crowd", speed: "0.14", cls: "c" },
  { name: "community-hands", alt: "Hands passing drinks across the table", speed: "0.3", cls: "d" },
];

const PEOPLE = ["Creatives", "Founders", "Musicians", "Designers", "Matcha people", "Night owls", "Newcomers", "Neighbors"];

export function Community() {
  return (
    <section id="community" className={`surface-paper on-paper ${styles.section}`} aria-labelledby="community-title">
      <div className={`container ${styles.grid}`}>
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            The Community
          </p>
          <h2 id="community-title" className={`display ${styles.title}`} data-reveal>
            Come alone. <em>Leave knowing somebody.</em>
          </h2>
          <p className={`lead ${styles.lead}`} data-reveal>
            Small rooms, long tables and a reason to talk to the person next to you. Every gathering is designed so that
            nobody stays a stranger for long.
          </p>
          <ul className={styles.people} aria-label="Who you’ll meet" data-reveal>
            {PEOPLE.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className={styles.sign} data-reveal>
            {COPY.goodDrinks}
          </p>
        </header>

        <div className={styles.collage}>
          {PHOTOS.map((p) => (
            <figure key={p.name} className={`${styles.photo} ${styles[p.cls]}`} data-parallax={p.speed}>
              <div className={styles.frame} data-reveal="mask">
                <BrandImage name={p.name} alt={p.alt} sizes="(min-width: 1024px) 28vw, 46vw" />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
