import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { logoutAction } from "./actions";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Team admin",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated();
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/admin" className={styles.brand}>
          Coffee &amp; Cannabis Club<small>Team admin</small>
        </Link>
        {authed && (
          <form action={logoutAction}>
            <button type="submit" className={styles.buttonGhost}>
              Sign out
            </button>
          </form>
        )}
      </header>
      <main className={styles.main} id="admin-main">
        {children}
      </main>
    </div>
  );
}
