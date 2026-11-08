import Link from "next/link";
import { ArchiveEmpty } from "@/components/archive/ArchiveEmpty";
import { RecapCard } from "@/components/archive/RecapCard";
import type { Drink, PublicGathering } from "@/lib/data/types";
import styles from "./PastGatherings.module.css";

export function PastGatherings({ past, drinks }: { past: PublicGathering[]; drinks: Drink[] }) {
  const drinkName = (slug: string | null) => drinks.find((d) => d.slug === slug)?.name ?? null;
  const shown = past.slice(0, 3);
  return (
    <section id="past" className={styles.section} aria-labelledby="past-title">
      <div className="container">
        <header className={styles.head}>
          <div>
            <h2 id="past-title" className={`display ${styles.title}`} data-reveal>
              The archive
            </h2>
          </div>
          {past.length > 0 && (
            <Link href="/gatherings" className="text-link" data-reveal>
              All gatherings
            </Link>
          )}
        </header>
        {shown.length ? (
          <div className={styles.grid}>
            {shown.map((g) => (
              <div key={g.id} data-reveal>
                <RecapCard g={g} drinkName={drinkName(g.drinkSlug)} />
              </div>
            ))}
          </div>
        ) : (
          <div data-reveal>
            <ArchiveEmpty />
          </div>
        )}
      </div>
    </section>
  );
}
