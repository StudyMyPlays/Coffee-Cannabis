import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminEnabled } from "@/lib/admin-auth";
import { AdminDisabled } from "../_components/AdminDisabled";
import { LoginForm } from "./LoginForm";
import styles from "../admin.module.css";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (!isAdminEnabled()) return <AdminDisabled />;
  if (await isAdminAuthenticated()) redirect("/admin");
  return (
    <div className={styles.narrow}>
      <p className={styles.eyebrow}>Team admin</p>
      <h1 className={styles.h1}>Sign in</h1>
      <p className={styles.muted}>Use the shared team password. Sessions last 12 hours.</p>
      <LoginForm />
    </div>
  );
}
