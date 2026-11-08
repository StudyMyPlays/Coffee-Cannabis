import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import styles from "./admin.module.css";

export default function Loading() {
  return (
    <LoadingRegion label="Loading…" className={`${styles.skeletonStack} on-paper`}>
      <Skeleton width="8rem" height="0.8em" />
      <Skeleton width="60%" height="2.4rem" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height="3.25rem" radius="var(--radius-md)" />
      ))}
    </LoadingRegion>
  );
}
