import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { CONTACT } from "@/lib/config";
import styles from "@/components/page/Page.module.css";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };

/** DRAFT — must be reviewed and completed by counsel before launch. */
export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms" />
      <section className={`surface-paper on-paper ${styles.paper}`}>
        <div className={`container ${styles.prose}`}>
          <p className={styles.notice}>Draft for legal review. This page is a placeholder and is not yet binding terms.</p>
          <h2>Membership</h2>
          <p>
            Founding membership is free and is not a purchase. It gives you early access to announcements and RSVPs; it
            does not guarantee entry to any specific gathering.
          </p>
          <h2>Age</h2>
          <p>
            Coffee &amp; Cannabis Club and its gatherings are for adults 21 and over. Valid ID may be requested at the
            door.
          </p>
          <h2>Gatherings and venue rules</h2>
          <p>
            Each gathering has its own venue rules, shared with confirmed guests ahead of time. Not every gathering permits
            cannabis consumption, and nothing on this site is an offer to sell cannabis or cannabis products. Where
            cannabis-related experiences are offered, they follow applicable California law and venue licensing.
          </p>
          <h2>Drinks</h2>
          <p>
            Drink descriptions describe flavor and experience only. We make no health or medical claims about any drink.
          </p>
          <h2>Contact</h2>
          <p>
            Questions? <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </p>
        </div>
      </section>
    </>
  );
}
