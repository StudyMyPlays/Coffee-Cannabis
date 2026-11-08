import { BrandImage } from "@/components/ui/BrandImage";
import { CCMark } from "@/components/ui/CCMark";
import { JoinForm } from "@/components/join/JoinForm";
import { COPY } from "@/lib/site";
import styles from "./FinalJoin.module.css";

export function FinalJoin() {
  return (
    <section id="join" className={styles.section} aria-labelledby="join-title">
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgImg} data-parallax="0.1">
          <BrandImage name="hero-field" alt="" sizes="100vw" />
        </div>
      </div>
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <CCMark className={styles.mark} label={null} />
          <p className="eyebrow" data-reveal>
            Free to join · 21+
          </p>
          <h2 id="join-title" className={`display ${styles.title}`} data-reveal>
            The first 1,000 <em>build the culture.</em>
          </h2>
          <p className={`lead ${styles.lead}`} data-reveal>
            Leave your details and you&rsquo;ll be first to know when and where the club meets next. {COPY.ritual}
          </p>
        </div>
        <div className={styles.formWrap} data-reveal>
          <JoinForm source="home_final" />
        </div>
      </div>
    </section>
  );
}
