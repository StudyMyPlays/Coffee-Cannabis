import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminEnabled, requireAdmin } from "@/lib/admin-auth";
import { drinkToFormValues } from "@/lib/admin-forms";
import { getDataAdapter } from "@/lib/data";
import { AdminDisabled } from "../../_components/AdminDisabled";
import { DeleteDrinkButton } from "../../_components/DeleteDrinkButton";
import { DrinkForm } from "../../_components/DrinkForm";
import { ReadOnlyBanner } from "../../_components/ReadOnlyBanner";
import styles from "../../admin.module.css";

export const metadata = { title: "Edit drink" };

export default async function EditDrinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!isAdminEnabled()) return <AdminDisabled />;
  await requireAdmin();
  const { slug } = await params;
  const sp = await searchParams;
  const adapter = getDataAdapter();
  const d = await adapter.getDrink(slug);
  if (!d) notFound();

  return (
    <>
      <p className={styles.eyebrow}>
        <Link className={styles.link} href="/admin">
          ← Dashboard
        </Link>
      </p>
      <h1 className={styles.h1}>
        {d.name}
        {d.trademark ? "™" : ""}
      </h1>
      {d.founding && (
        <p>
          <span className={styles.badgeGold}>Founding Five — permanent</span>
        </p>
      )}
      {sp.saved && (
        <p className={`${styles.bannerOk} state-enter`} role="status">
          Saved. The public site has been refreshed.
        </p>
      )}
      {!adapter.contentWritable && <ReadOnlyBanner />}

      <DrinkForm initial={drinkToFormValues(d)} isNew={false} founding={d.founding} readOnly={!adapter.contentWritable} />

      {!d.founding && (
        <section className={styles.section} aria-labelledby="danger-h">
          <div className={styles.sectionHead}>
            <h2 id="danger-h" className={styles.h2}>
              Remove
            </h2>
          </div>
          <p className={styles.muted}>Prefer unchecking “Active” to hide a drink between seasons. Deleting is permanent.</p>
          <DeleteDrinkButton slug={d.slug} name={d.name} disabled={!adapter.contentWritable} />
        </section>
      )}
    </>
  );
}
