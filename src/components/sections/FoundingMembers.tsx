import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import { PaisleyGlyph } from "@/components/paisley";
import { FOUNDING_CAP } from "@/lib/site";
import styles from "./FoundingMembers.module.css";

const BENEFITS = [
  { t: "First access", d: "Hear about every gathering before it’s announced anywhere else." },
  { t: "Priority RSVP", d: "Your spot opens before the general list." },
  { t: "Secret drops", d: "Off-menu rituals, pop-ups and invitations that never go public." },
  { t: "Clubhouse previews", d: "A first look as the permanent home takes shape." },
  { t: "Member-only moments", d: "Small-format evenings built just for members." },
  { t: "Original recognition", d: "Your founding number, recognized as part of the original community." },
];

export function FoundingMembers({ memberCount }: { memberCount: number }) {
  const remaining = Math.max(0, FOUNDING_CAP - memberCount);
  return (
    <section id="founding" className={`surface-paper on-paper ${styles.section}`} aria-labelledby="founding-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.cardCol}>
          <div className={styles.stage}>
            <div className={styles.card} data-tilt>
              <BrandImage name="member-card" alt="The Coffee & Cannabis Club Founding Member card" sizes="(min-width: 1024px) 44vw, 92vw" />
            </div>
          </div>
          <p className={styles.counter} data-reveal>
            <strong>{remaining.toLocaleString("en-US")}</strong> of {FOUNDING_CAP.toLocaleString("en-US")} founding spots
            remain
          </p>
        </div>

        <div className={styles.copy}>
          <h2 id="founding-title" className={`display ${styles.title}`} data-reveal>
            A club <em>before there&rsquo;s a clubhouse.</em>
          </h2>
          <p className={`lead ${styles.lead}`} data-reveal>
            Founding Members shape what this becomes. Being early comes with a few things.
          </p>
          <ul className={styles.benefits}>
            {BENEFITS.map((b) => (
              <li key={b.t} data-reveal>
                <PaisleyGlyph className={styles.glyph} />
                <div>
                  <h3>{b.t}</h3>
                  <p>{b.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="#join" className="btn btn--green" data-reveal>
            Become a Founding Member
          </Link>
        </div>
      </div>
    </section>
  );
}
