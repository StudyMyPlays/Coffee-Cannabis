import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { CancelRsvp } from "./CancelRsvp";
import styles from "@/components/page/Page.module.css";

export const metadata: Metadata = {
  title: "Manage your RSVP",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function CancelPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Your RSVP" title={<>Manage your <em>spot</em></>} />
      <section className={styles.body}>
        <div className="container">
          <div className={styles.panel} data-reveal>
            <CancelRsvp token={typeof token === "string" ? token : ""} />
          </div>
        </div>
      </section>
    </>
  );
}
