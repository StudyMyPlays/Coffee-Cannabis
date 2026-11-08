import { PaisleyDivider } from "@/components/paisley";
import { LoadingRegion, Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import pageStyles from "@/components/page/Page.module.css";
import styles from "./PageSkeleton.module.css";

/**
 * Route-level loading skeletons that mirror the real page geometry, so content
 * swaps in without a layout jump.
 *  - "gathering": PageHero + text/RSVP column + map
 *  - "drink":     arched photo + copy column
 *  - "panel":     PageHero + single bordered panel (RSVP management)
 */
export function PageSkeleton({ variant, label }: { variant: "gathering" | "drink" | "panel"; label: string }) {
  if (variant === "drink") {
    return (
      <LoadingRegion label={label} className={styles.drink}>
        <div className={`container ${styles.drinkGrid}`}>
          <Skeleton className={styles.arch} height="auto" radius="999px 999px var(--radius-md) var(--radius-md)" />
          <div className={styles.stack}>
            <Skeleton width="14rem" height="0.8em" />
            <Skeleton width="70%" height="var(--step-5)" />
            <Skeleton width="55%" height="var(--step-2)" />
            <SkeletonText lines={4} />
            <div className={styles.row}>
              <Skeleton width="10rem" height="52px" radius="var(--radius-pill)" />
              <Skeleton width="10rem" height="52px" radius="var(--radius-pill)" />
            </div>
          </div>
        </div>
      </LoadingRegion>
    );
  }

  return (
    <LoadingRegion label={label}>
      <header className={pageStyles.hero}>
        <div className="container">
          <Skeleton width="12rem" height="0.8em" />
          <Skeleton width="min(36rem, 90%)" height="var(--step-5)" />
          {variant === "gathering" && <Skeleton width="min(28rem, 80%)" height="var(--step-5)" />}
          <Skeleton width="min(22rem, 70%)" height="var(--step-1)" />
          <PaisleyDivider className={pageStyles.divider} />
        </div>
      </header>
      <section className={pageStyles.body}>
        {variant === "panel" ? (
          <div className="container">
            <div className={`${pageStyles.panel} ${styles.stack}`}>
              <Skeleton width="16rem" height="0.8em" />
              <Skeleton width="80%" height="var(--step-3)" />
              <Skeleton width="11rem" height="52px" radius="var(--radius-pill)" />
            </div>
          </div>
        ) : (
          <div className={`container ${pageStyles.split}`}>
            <div className={styles.stack}>
              <SkeletonText lines={3} />
              <div className={styles.row}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} width="4.5rem" height="4.5rem" radius="var(--radius-md)" />
                ))}
              </div>
              <Skeleton height="3px" radius="var(--radius-pill)" />
              <Skeleton height="52px" />
              <Skeleton height="52px" radius="var(--radius-pill)" />
            </div>
            <Skeleton className={styles.map} height="auto" radius="var(--radius-lg)" />
          </div>
        )}
      </section>
    </LoadingRegion>
  );
}
