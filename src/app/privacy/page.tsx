import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { CONTACT } from "@/lib/config";
import styles from "@/components/page/Page.module.css";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

/** DRAFT — must be reviewed and completed by counsel before launch. */
export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className={`surface-paper on-paper ${styles.paper}`}>
        <div className={`container ${styles.prose}`} data-reveal>
          <p className={styles.notice}>Draft for legal review. This page is a placeholder and is not yet a binding policy.</p>
          <h2>What we collect</h2>
          <p>
            When you join or RSVP we collect the details you give us: your name, email, and optionally your mobile number,
            ZIP code or neighborhood and Instagram handle. We also collect basic, aggregated analytics about how the site
            is used.
          </p>
          <h2>How we use it</h2>
          <ul>
            <li>To send gathering announcements, location drops, reminders and member news you agreed to receive.</li>
            <li>To manage capacity, waitlists and RSVPs for gatherings.</li>
            <li>To understand what&rsquo;s working on the site and improve it.</li>
          </ul>
          <h2>Your choices</h2>
          <p>
            Unsubscribe from any email using the link at the bottom, or reply STOP to any text. To access or delete your
            information, email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </p>
          <h2>We don&rsquo;t sell your data</h2>
          <p>We never sell your personal information. California residents have additional rights under the CCPA/CPRA.</p>
        </div>
      </section>
    </>
  );
}
