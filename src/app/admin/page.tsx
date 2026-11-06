import Link from "next/link";
import { isAdminEnabled, requireAdmin } from "@/lib/admin-auth";
import { getDataAdapter } from "@/lib/data";
import { hasEnded, isAddressReleased } from "@/lib/data/public";
import { formatLaDate, laWallTimeToUtc } from "@/lib/time";
import { AdminDisabled } from "./_components/AdminDisabled";
import { ReadOnlyBanner } from "./_components/ReadOnlyBanner";
import styles from "./admin.module.css";

export const metadata = { title: "Dashboard" };

const STATUS_BADGE: Record<string, string> = {
  upcoming: styles.badgeGreen!,
  draft: styles.badge!,
  past: styles.badge!,
  cancelled: styles.badgeRed!,
};

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!isAdminEnabled()) return <AdminDisabled />;
  await requireAdmin();
  const sp = await searchParams;

  const adapter = getDataAdapter();
  const now = Date.now();
  const [gatherings, drinks, memberCount] = await Promise.all([
    adapter.listGatherings(),
    adapter.listDrinks(),
    adapter.countMembers(),
  ]);
  const rows = await Promise.all(gatherings.map(async (g) => ({ g, counts: await adapter.countRsvps(g.id) })));
  rows.sort((a, b) => b.g.number - a.g.number);

  return (
    <>
      <p className={styles.eyebrow}>Dashboard</p>
      <h1 className={styles.h1}>Gatherings &amp; drinks</h1>
      <p className={styles.muted}>
        {memberCount} founding member{memberCount === 1 ? "" : "s"} ·{" "}
        <a className={styles.link} href="/admin/export/members">
          Download members (CSV)
        </a>
      </p>
      {sp.deleted && (
        <p className={styles.bannerOk} role="status">
          Drink deleted.
        </p>
      )}
      {!adapter.contentWritable && <ReadOnlyBanner />}

      <section className={styles.section} aria-labelledby="gatherings-h">
        <div className={styles.sectionHead}>
          <h2 id="gatherings-h" className={styles.h2}>
            Gatherings
          </h2>
          <Link href="/admin/gatherings/new" className={styles.button}>
            New gathering
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className={styles.muted}>No gatherings yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Title</th>
                  <th scope="col">Date (PT)</th>
                  <th scope="col">Neighborhood</th>
                  <th scope="col">Status</th>
                  <th scope="col">Confirmed</th>
                  <th scope="col">Waitlist</th>
                  <th scope="col">Address</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ g, counts }) => {
                  const start = laWallTimeToUtc(g.startsAt);
                  const ended = g.status === "upcoming" && hasEnded(g, now);
                  return (
                    <tr key={g.id}>
                      <td className={styles.num}>{String(g.number).padStart(2, "0")}</td>
                      <td>
                        <Link className={styles.link} href={`/admin/gatherings/${g.id}`}>
                          {g.title}
                        </Link>
                        {g.isPlaceholder && (
                          <>
                            {" "}
                            <span className={styles.badgeGold}>sample</span>
                          </>
                        )}
                      </td>
                      <td>
                        {formatLaDate(start, { format: "short" })}
                        <br />
                        <span className={styles.muted}>{formatLaDate(start, { format: "time" })}</span>
                      </td>
                      <td>{g.neighborhood ?? <span className={styles.muted}>TBA</span>}</td>
                      <td>
                        <span className={STATUS_BADGE[g.status]}>{g.status}</span>
                        {ended && (
                          <>
                            {" "}
                            <span className={styles.badge}>ended</span>
                          </>
                        )}
                      </td>
                      <td className={styles.num}>
                        {counts.confirmed} / {g.capacity}
                      </td>
                      <td className={styles.num}>{counts.waitlist}</td>
                      <td>
                        {isAddressReleased(g, now) ? (
                          <span className={styles.badgeGreen}>released</span>
                        ) : g.addressReleaseAt ? (
                          <span className={styles.muted}>
                            {formatLaDate(laWallTimeToUtc(g.addressReleaseAt), { format: "shortNoYear" })}
                          </span>
                        ) : (
                          <span className={styles.muted}>hidden</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="drinks-h">
        <div className={styles.sectionHead}>
          <h2 id="drinks-h" className={styles.h2}>
            Drinks
          </h2>
          <Link href="/admin/drinks/new" className={styles.button}>
            New seasonal drink
          </Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Type</th>
                <th scope="col">Visibility</th>
                <th scope="col">Add-on note</th>
              </tr>
            </thead>
            <tbody>
              {drinks.map((d) => (
                <tr key={d.slug}>
                  <td className={styles.num}>{d.order}</td>
                  <td>
                    <span className={styles.dot} style={{ background: d.accent }} aria-hidden />
                    <Link className={styles.link} href={`/admin/drinks/${d.slug}`}>
                      {d.name}
                      {d.trademark ? "™" : ""}
                    </Link>
                  </td>
                  <td>{d.role}</td>
                  <td>
                    {d.founding ? <span className={styles.badgeGold}>Founding Five</span> : d.seasonal ? <span className={styles.badge}>Seasonal</span> : <span className={styles.badge}>Menu</span>}
                  </td>
                  <td>
                    {!d.active ? (
                      <span className={styles.badgeRed}>hidden</span>
                    ) : d.secret ? (
                      <span className={styles.badge}>secret</span>
                    ) : (
                      <span className={styles.badgeGreen}>live</span>
                    )}
                  </td>
                  <td>
                    {!d.addOnNote ? (
                      <span className={styles.muted}>—</span>
                    ) : d.legalReviewed ? (
                      <span className={styles.badgeGreen}>published</span>
                    ) : (
                      <span className={styles.badgeGold}>awaiting legal review</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
