import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page/PageHero";
import { ArchiveEmpty } from "@/components/archive/ArchiveEmpty";
import { RecapCard } from "@/components/archive/RecapCard";
import { getDataAdapter } from "@/lib/data";
import { getNextGathering, getPastGatherings, getPublicDrinks } from "@/lib/data/public";
import { fmtShortDate, pad2 } from "@/lib/format";
import styles from "@/components/page/Page.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Past Gatherings",
  description: "Recaps, photos, playlists and the drink of every Coffee & Cannabis Club gathering.",
  alternates: { canonical: "/gatherings" },
};

export default async function GatheringsPage() {
  const adapter = getDataAdapter();
  const [past, next, drinks] = await Promise.all([getPastGatherings(adapter), getNextGathering(adapter), getPublicDrinks(adapter)]);
  const name = (slug: string | null) => drinks.find((d) => d.slug === slug)?.name ?? null;

  return (
    <>
      <PageHero eyebrow="The archive" title={<>Past <em>gatherings</em></>}>
        <p>Every gathering leaves something behind: a playlist, a few photos, a line somebody said that stuck.</p>
      </PageHero>
      <section className={styles.body}>
        <div className={`container ${styles.archive}`}>
          {next && (
            <p data-reveal>
              Up next: <Link href={`/gatherings/${next.slug}`}>Gathering No. {pad2(next.number)} · {fmtShortDate(next.startsAtUtc)}</Link>
            </p>
          )}
          {past.length ? (
            <div className={styles.cards}>
              {past.map((g) => (
                <div key={g.id} data-reveal>
                  <RecapCard g={g} drinkName={name(g.drinkSlug)} />
                </div>
              ))}
            </div>
          ) : (
            <div data-reveal>
              <ArchiveEmpty headingLevel={2} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
