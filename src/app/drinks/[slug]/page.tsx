import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrinkVisual } from "@/components/rituals/DrinkVisual";
import { getDataAdapter } from "@/lib/data";
import { getPublicDrink } from "@/lib/data/public";
import styles from "./drink.module.css";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await getPublicDrink(getDataAdapter(), slug);
  if (!d) return { title: "Ritual not found" };
  return {
    title: `${d.name} · ${d.profile}`,
    description: d.sensory,
    alternates: { canonical: `/drinks/${d.slug}` },
    // The off-menu ritual stays out of search results.
    robots: d.secret ? { index: false, follow: false } : undefined,
  };
}

/** Order of each line in the CSS page intro (see [data-intro] in globals.css). */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function DrinkPage({ params }: Props) {
  const { slug } = await params;
  const d = await getPublicDrink(getDataAdapter(), slug);
  if (!d) notFound();

  return (
    <article className={styles.page} style={{ "--accent": d.accent } as React.CSSProperties}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.visual} data-intro style={order(0)}>
          <DrinkVisual drink={d} sizes="(min-width: 1024px) 45vw, 100vw" priority />
        </div>
        <div className={styles.copy}>
          <p className="eyebrow" data-intro style={order(1)}>
            {d.secret ? "Off the menu" : d.founding ? "The Founding Five" : "Seasonal ritual"} · {d.role}
          </p>
          <h1 className={`display ${styles.name}`} data-intro style={order(2)}>
            {d.name}
            {d.trademark && <sup>™</sup>}
          </h1>
          <p className={styles.profile} data-intro style={order(3)}>
            {d.profile}
          </p>
          <p className="lead" data-intro style={order(4)}>
            {d.sensory}
          </p>
          {d.notes.length > 0 && (
            <>
              <h2 className={styles.h2} data-intro style={order(5)}>
                In the cup
              </h2>
              <ul className={styles.notes} data-intro style={order(5)}>
                {d.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </>
          )}
          {d.addOnNote && (
            <p className="muted" data-intro style={order(6)}>
              {d.addOnNote}
            </p>
          )}
          <div className={styles.actions} data-intro style={order(6)}>
            <Link href="/#rituals" className="btn btn--ghost">
              All rituals
            </Link>
            <Link href="/#join" className="btn">
              Join the club
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
