import { PaisleyDivider } from "@/components/paisley";
import { COPY } from "@/lib/site";
import styles from "./WhyClub.module.css";

/** Split a line into word spans the motion controller can scrub. */
function Words({ text, emphasize = [] }: { text: string; emphasize?: string[] }) {
  return (
    <>
      {text.split(" ").map((word, i) => {
        const bare = word.replace(/[.,]/g, "");
        const em = emphasize.includes(bare);
        return (
          <span key={i} className={`w ${em ? styles.em : ""}`}>
            {word}{" "}
          </span>
        );
      })}
    </>
  );
}

export function WhyClub() {
  return (
    <section id="why" className={`surface-paper on-paper ${styles.section}`} aria-labelledby="why-title">
      <div className={styles.pin} data-pin>
        <div className={`container ${styles.inner}`}>
          <p className="eyebrow">Why the club exists</p>
          <h2 id="why-title" className="sr-only">
            Why the club exists
          </h2>
          <p className={`display ${styles.statement}`} data-words>
            <Words text={COPY.why[0]} emphasize={["enormous", "disconnected"]} />
            <span className={styles.break} aria-hidden="true" />
            <Words text={COPY.why[1]} emphasize={["actually", "meet", "people"]} />
          </p>
          <PaisleyDivider className={styles.divider} />
          <div className={styles.coda}>
            <p data-reveal>{COPY.ritual}</p>
            <p data-reveal data-reveal-delay="0.12">
              {COPY.clubhouse}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
