import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { JoinForm } from "@/components/join/JoinForm";
import { COPY } from "@/lib/site";
import styles from "@/components/page/Page.module.css";

export const metadata: Metadata = {
  title: "Become a Founding Member",
  description: `${COPY.first1000} Join Coffee & Cannabis Club for first access to gatherings, priority RSVP and secret drops.`,
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <>
      <PageHero eyebrow="Founding membership · 21+" title={<>The first 1,000 <em>build the culture.</em></>}>
        <p>First access to gatherings, priority RSVP, secret drops and a founding number that&rsquo;s yours for good.</p>
      </PageHero>
      <section className={styles.body}>
        <div className="container">
          <div className={styles.panel} data-reveal>
            <JoinForm source="join_page" idPrefix="joinpage" />
          </div>
        </div>
      </section>
    </>
  );
}
