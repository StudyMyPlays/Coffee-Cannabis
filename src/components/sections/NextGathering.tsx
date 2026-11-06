import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import { PaisleyCorner } from "@/components/paisley";
import { Countdown } from "@/components/gathering/Countdown";
import { EventMap } from "@/components/gathering/EventMap";
import { RsvpPanel } from "@/components/gathering/RsvpPanel";
import { fmtLongDate, fmtShortDate, fmtTime, fmtTimeRange, pad2 } from "@/lib/format";
import type { PublicGathering } from "@/lib/data/types";
import styles from "./NextGathering.module.css";

export function NextGathering({ gathering: g, now }: { gathering: PublicGathering | null; now: number }) {
  return (
    <section id="gathering" className={styles.section} aria-labelledby="gathering-title">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.backdropImg} data-parallax="0.18">
          <BrandImage name="event-backdrop" alt="" sizes="100vw" />
        </div>
      </div>

      <div className={`container ${styles.inner}`}>
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            The next gathering
          </p>
          <h2 id="gathering-title" className={`display ${styles.title}`} data-reveal>
            {g ? (
              <>
                Gathering <em>No.&nbsp;{pad2(g.number)}</em>
              </>
            ) : (
              <>
                The next one is <em>coming.</em>
              </>
            )}
          </h2>
        </header>

        {g ? (
          <article className={styles.module} data-reveal aria-label={`Gathering number ${g.number}`}>
            <PaisleyCorner position="tl" className={`${styles.corner} ${styles.tl}`} />
            <PaisleyCorner position="tr" className={`${styles.corner} ${styles.tr}`} />
            <PaisleyCorner position="bl" className={`${styles.corner} ${styles.bl}`} />
            <PaisleyCorner position="br" className={`${styles.corner} ${styles.br}`} />

            <div className={styles.info}>
              <span className={styles.numeral} aria-hidden="true">
                {pad2(g.number)}
              </span>

              <dl className={styles.meta}>
                <div>
                  <dt>When</dt>
                  <dd>
                    {fmtLongDate(g.startsAtUtc)}
                    <span>{fmtTimeRange(g.startsAtUtc, g.endsAtUtc)}</span>
                  </dd>
                </div>
                <div>
                  <dt>Where</dt>
                  <dd>
                    {g.neighborhood ?? "Neighborhood: TBA"}
                    <span>Los Angeles · exact address released to guests</span>
                  </dd>
                </div>
              </dl>
              {g.isPlaceholder && (
                <p className={styles.sample}>
                  <span className="sample-tag">Sample date</span> Set the real gathering in the admin.
                </p>
              )}

              <p className={styles.desc}>{g.description}</p>

              <div className={styles.countdown}>
                <p className={styles.label}>Doors open in</p>
                <Countdown startsAtUtc={g.startsAtUtc} endsAtUtc={g.endsAtUtc} initialNow={now} />
              </div>

              <RsvpPanel gathering={g} />
            </div>

            <div className={styles.mapCol}>
              <EventMap
                neighborhood={g.neighborhood}
                center={g.neighborhoodCenter}
                venue={g.venueLocation}
                address={g.address}
                releaseLabel={
                  g.addressReleaseAtUtc ? `${fmtShortDate(g.addressReleaseAtUtc)}, ${fmtTime(g.addressReleaseAtUtc)}` : null
                }
              />
              <Link href={`/gatherings/${g.slug}`} className={`text-link ${styles.detail}`}>
                Gathering details
              </Link>
            </div>
          </article>
        ) : (
          <div className={styles.empty} data-reveal>
            <p className="lead">
              Dates drop to members first. Join the club and you&rsquo;ll hear about the next gathering before anyone
              else.
            </p>
            <Link href="#join" className="btn">
              Join the club
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
