import Link from "next/link";
import { PageHero } from "@/components/page/PageHero";
import styles from "@/components/page/Page.module.css";

export default function NotFound() {
  return (
    <>
      <PageHero eyebrow="404" title={<>This room is <em>empty.</em></>}>
        <p>The page you were looking for isn&rsquo;t here. The people are back at the club.</p>
      </PageHero>
      <section className={styles.body}>
        <div className="container" data-reveal>
          <Link href="/" className="btn">
            Back to the club
          </Link>
        </div>
      </section>
    </>
  );
}
