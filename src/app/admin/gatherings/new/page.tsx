import Link from "next/link";
import { isAdminEnabled, requireAdmin } from "@/lib/admin-auth";
import { gatheringToFormValues } from "@/lib/admin-forms";
import { getDataAdapter } from "@/lib/data";
import { AdminDisabled } from "../../_components/AdminDisabled";
import { GatheringForm } from "../../_components/GatheringForm";
import { ReadOnlyBanner } from "../../_components/ReadOnlyBanner";
import styles from "../../admin.module.css";

export const metadata = { title: "New gathering" };

export default async function NewGatheringPage() {
  if (!isAdminEnabled()) return <AdminDisabled />;
  await requireAdmin();
  const adapter = getDataAdapter();
  const [gatherings, drinks] = await Promise.all([adapter.listGatherings(), adapter.listDrinks()]);
  const number = gatherings.reduce((m, g) => Math.max(m, g.number), 0) + 1;
  const nn = String(number).padStart(2, "0");

  return (
    <>
      <p className={styles.eyebrow}>
        <Link className={styles.link} href="/admin">
          ← Dashboard
        </Link>
      </p>
      <h1 className={styles.h1}>New gathering</h1>
      <p className={styles.muted}>Starts as a draft so you can prepare it privately. Switch to “Upcoming” to open RSVPs.</p>
      {!adapter.contentWritable && <ReadOnlyBanner />}
      <GatheringForm
        initial={gatheringToFormValues(null, {
          number,
          title: `Gathering No. ${nn}`,
          slug: `gathering-${nn}`,
          capacity: 60,
          status: "draft",
          description: "",
        })}
        drinks={drinks.map((d) => ({ slug: d.slug, name: d.name }))}
        isNew
        readOnly={!adapter.contentWritable}
      />
    </>
  );
}
