import { PageSkeleton } from "@/components/states/PageSkeleton";

export default function Loading() {
  return <PageSkeleton variant="gathering" label="Loading the gathering…" />;
}
