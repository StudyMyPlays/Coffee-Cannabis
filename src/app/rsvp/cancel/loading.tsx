import { PageSkeleton } from "@/components/states/PageSkeleton";

export default function Loading() {
  return <PageSkeleton variant="panel" label="Finding your RSVP…" />;
}
