import styles from "./HowItWorks.module.css";

const STEPS = [
  { t: "Join", d: "Become a Founding Member. It takes a minute." },
  { t: "Receive the drop", d: "Dates and neighborhoods reach members first." },
  { t: "RSVP", d: "Claim a spot before the room fills, or join the waitlist." },
  { t: "Show up", d: "The exact location lands in your inbox before doors open." },
  { t: "Meet people", d: "Long tables, good music, conversations that keep going." },
  { t: "Come back", d: "Familiar faces, new ones, and a club that grows with you." },
];

export function HowItWorks() {
  return (
    <section id="how" className={styles.section} aria-labelledby="how-title">
      <div className="container">
        <header className={styles.head}>
          <h2 id="how-title" className={`display ${styles.title}`} data-reveal>
            Six steps from <em>stranger</em> to regular.
          </h2>
        </header>
        <div className={styles.stepsWrap}>
          <span className={styles.thread} data-draw="x" aria-hidden="true" />
          <span className={styles.threadY} data-draw="y" aria-hidden="true" />
          <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.t} className={styles.step} data-reveal data-reveal-delay={String(i * 0.06)}>
              <span className={styles.num} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.stepTitle}>{s.t}</h3>
              <p className={styles.stepText}>{s.d}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
