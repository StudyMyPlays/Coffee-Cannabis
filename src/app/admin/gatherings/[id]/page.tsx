import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminEnabled, requireAdmin } from "@/lib/admin-auth";
import { gatheringToFormValues } from "@/lib/admin-forms";
import { getDataAdapter } from "@/lib/data";
import { isAddressReleased } from "@/lib/data/public";
import { formatLaDate, laWallTimeToUtc } from "@/lib/time";
import { AdminDisabled } from "../../_components/AdminDisabled";
import { GatheringForm } from "../../_components/GatheringForm";
import { ReadOnlyBanner } from "../../_components/ReadOnlyBanner";
import styles from "../../admin.module.css";

export const metadata = { title: "Edit gathering" };

export default async function EditGatheringPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!isAdminEnabled()) return <AdminDisabled />;
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const adapter = getDataAdapter();
  const g = await adapter.getGathering(id);
  if (!g) notFound();
  const [drinks, rsvps, counts] = await Promise.all([adapter.listDrinks(), adapter.listRsvps(g.id), adapter.countRsvps(g.id)]);
  const released = isAddressReleased(g);

  return (
    <>
      <p className={styles.eyebrow}>
        <Link className={styles.link} href="/admin">
          ← Dashboard
        </Link>
      </p>
      <h1 className={styles.h1}>{g.title}</h1>
      <p className={styles.muted}>
        {formatLaDate(laWallTimeToUtc(g.startsAt), { format: "dateTime" })} · {counts.confirmed}/{g.capacity} confirmed ·{" "}
        {counts.waitlist} waitlisted · address {released ? "released" : "hidden"}
      </p>
      {sp.saved && (
        <p className={styles.bannerOk} role="status">
          Saved. The public site has been refreshed.
        </p>
      )}
      {!adapter.contentWritable && <ReadOnlyBanner />}

      <GatheringForm
        initial={gatheringToFormValues(g)}
        drinks={drinks.map((d) => ({ slug: d.slug, name: d.name }))}
        isNew={false}
        readOnly={!adapter.contentWritable}
      />

      <section className={styles.section} aria-labelledby="rsvps-h">
        <div className={styles.sectionHead}>
          <h2 id="rsvps-h" className={styles.h2}>
            RSVPs ({rsvps.length})
          </h2>
          <a className={styles.buttonGhost} href={`/admin/export/rsvps?gatheringId=${encodeURIComponent(g.id)}`}>
            Download CSV
          </a>
        </div>
        {rsvps.length === 0 ? (
          <p className={styles.muted}>No RSVPs yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created (PT)</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r, i) => (
                  <tr key={r.id}>
                    <td className={styles.num}>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>
                      <a className={styles.link} href={`mailto:${r.email}`}>
                        {r.email}
                      </a>
                    </td>
                    <td>
                      <span
                        className={
                          r.status === "confirmed" ? styles.badgeGreen : r.status === "waitlist" ? styles.badgeGold : styles.badgeRed
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className={styles.num}>
                      {formatLaDate(r.createdAt, { format: "short" })} {formatLaDate(r.createdAt, { format: "time" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
