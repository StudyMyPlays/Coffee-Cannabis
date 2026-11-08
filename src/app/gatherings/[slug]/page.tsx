import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page/PageHero";
import { Countdown } from "@/components/gathering/Countdown";
import { EventMap } from "@/components/gathering/EventMap";
import { RsvpPanel } from "@/components/gathering/RsvpPanel";
import { RecapCard } from "@/components/archive/RecapCard";
import { getDataAdapter } from "@/lib/data";
import { getPublicGathering } from "@/lib/data/public";
import { fmtLongDate, fmtShortDate, fmtTime, fmtTimeRange, pad2 } from "@/lib/format";
import styles from "@/components/page/Page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = await getPublicGathering(getDataAdapter(), slug);
  if (!g) return { title: "Gathering not found" };
  return {
    title: `${g.title} · ${fmtShortDate(g.startsAtUtc)}`,
    description: `${g.neighborhood ?? "Los Angeles"} · ${fmtLongDate(g.startsAtUtc)}. ${g.description}`,
    alternates: { canonical: `/gatherings/${g.slug}` },
  };
}

export default async function GatheringPage({ params }: Props) {
  const { slug } = await params;
  const adapter = getDataAdapter();
  const g = await getPublicGathering(adapter, slug);
  if (!g) notFound();
  // Server Component: renders once per request, so reading the clock here is safe.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const ended = now > Date.parse(g.endsAtUtc) || g.status === "past";
  const drink = g.drinkSlug ? await adapter.getDrink(g.drinkSlug) : null;

  return (
    <>
      <PageHero
        eyebrow={`Gathering No. ${pad2(g.number)}${g.status === "cancelled" ? " · Cancelled" : ""}`}
        title={
          <>
            {fmtLongDate(g.startsAtUtc)}
            <br />
            <em>{g.neighborhood ?? "Neighborhood: TBA"}</em>
          </>
        }
      >
        <p>
          {fmtTimeRange(g.startsAtUtc, g.endsAtUtc)} · Los Angeles · 21+
          {g.isPlaceholder && (
            <>
              {" "}
              <span className="sample-tag">Sample date</span>
            </>
          )}
        </p>
      </PageHero>

      <section className={styles.body}>
        <div className={`container ${styles.split}`}>
          <div className={styles.stack}>
            <p className="lead">{g.description}</p>
            {drink && drink.active && (
              <p className="muted">
                Drink of the gathering: <Link href={`/drinks/${drink.slug}`}>{drink.name}</Link>
              </p>
            )}
            {ended ? (
              g.recap ? (
                <RecapCard g={g} drinkName={drink?.name} />
              ) : (
                <p className="muted">This gathering has ended. The recap is on its way.</p>
              )
            ) : (
              <>
                <Countdown startsAtUtc={g.startsAtUtc} endsAtUtc={g.endsAtUtc} initialNow={now} />
                <RsvpPanel gathering={g} />
              </>
            )}
            <p className="muted" style={{ fontSize: "var(--step--1)" }}>
              Venue rules differ by gathering and are shared with confirmed guests ahead of time. Not every gathering
              permits cannabis consumption.
            </p>
          </div>
          <EventMap
            neighborhood={g.neighborhood}
            center={g.neighborhoodCenter}
            venue={g.venueLocation}
            address={g.address}
            releaseLabel={g.addressReleaseAtUtc ? `${fmtShortDate(g.addressReleaseAtUtc)}, ${fmtTime(g.addressReleaseAtUtc)}` : null}
          />
        </div>
      </section>
    </>
  );
}
