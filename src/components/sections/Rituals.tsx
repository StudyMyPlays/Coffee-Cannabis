import { PaisleyDivider } from "@/components/paisley";
import { DrinkDialog } from "@/components/rituals/DrinkDialog";
import { DrinkVisual } from "@/components/rituals/DrinkVisual";
import { GreenMileReveal } from "@/components/rituals/GreenMileReveal";
import { pad2 } from "@/lib/format";
import type { Drink } from "@/lib/data/types";
import styles from "./Rituals.module.css";

export function Rituals({ drinks, secret }: { drinks: Drink[]; secret: Drink | null }) {
  const sizes = "(min-width: 1024px) 46vw, 92vw";
  return (
    <section id="rituals" className={styles.section} aria-labelledby="rituals-title">
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            The Rituals
          </p>
          <h2 id="rituals-title" className={`display ${styles.title}`} data-reveal>
            Come for <em>the ritual.</em>
          </h2>
          <p className={`lead ${styles.intro}`} data-reveal>
            Signature drinks made to be shared across a table. The drinks are the ritual. The community is the product.
          </p>
        </header>

        <ol className={styles.list}>
          {drinks.map((d, i) => (
            <li key={d.slug} className={styles.spread} style={{ "--accent": d.accent } as React.CSSProperties}>
              <div className={styles.visualWrap} data-reveal="mask">
                <div className={styles.visual} data-parallax="0.12">
                  <DrinkVisual drink={d} sizes={sizes} />
                </div>
              </div>
              <div className={styles.copy}>
                <p className={styles.index} data-reveal>
                  <span>{pad2(i + 1)}</span> / {pad2(drinks.length)} · {d.role}
                </p>
                <h3 className={`display ${styles.name}`} data-reveal>
                  {d.name}
                  {d.trademark && <sup>™</sup>}
                </h3>
                <p className={styles.profile} data-reveal>
                  {d.profile}
                </p>
                <p className={styles.sensory} data-reveal>
                  {d.sensory}
                </p>
                {d.notes.length > 0 && (
                  <p className={styles.notes} data-reveal>
                    {d.notes.join(" · ")}
                  </p>
                )}
                <div data-reveal>
                  <DrinkDialog drink={d}>
                    <DrinkVisual drink={d} sizes="(min-width: 768px) 480px, 100vw" />
                  </DrinkDialog>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {secret && (
          <div className={styles.secret}>
            <PaisleyDivider className={styles.divider} />
            <GreenMileReveal drink={secret} visual={<DrinkVisual drink={secret} sizes="(min-width: 768px) 520px, 100vw" />} />
          </div>
        )}
      </div>
    </section>
  );
}
