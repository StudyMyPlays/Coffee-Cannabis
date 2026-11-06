import Link from "next/link";
import { isAdminEnabled, requireAdmin } from "@/lib/admin-auth";
import { drinkToFormValues } from "@/lib/admin-forms";
import { getDataAdapter } from "@/lib/data";
import { AdminDisabled } from "../../_components/AdminDisabled";
import { DrinkForm } from "../../_components/DrinkForm";
import { ReadOnlyBanner } from "../../_components/ReadOnlyBanner";
import styles from "../../admin.module.css";

export const metadata = { title: "New seasonal drink" };

export default async function NewDrinkPage() {
  if (!isAdminEnabled()) return <AdminDisabled />;
  await requireAdmin();
  const adapter = getDataAdapter();
  const drinks = await adapter.listDrinks();
  const order = drinks.reduce((m, d) => Math.max(m, d.order), 0) + 1;

  return (
    <>
      <p className={styles.eyebrow}>
        <Link className={styles.link} href="/admin">
          ← Dashboard
        </Link>
      </p>
      <h1 className={styles.h1}>New seasonal drink</h1>
      {!adapter.contentWritable && <ReadOnlyBanner />}
      <DrinkForm
        initial={drinkToFormValues(null, {
          order,
          role: "Seasonal",
          seasonal: true,
          active: false,
          trademark: false,
          accent: "#8db35a",
          notes: [],
        })}
        isNew
        founding={false}
        readOnly={!adapter.contentWritable}
      />
    </>
  );
}
