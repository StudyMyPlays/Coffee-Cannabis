import styles from "../admin.module.css";

export function AdminDisabled() {
  return (
    <div className={styles.narrow}>
      <p className={styles.eyebrow}>Team admin</p>
      <h1 className={styles.h1}>Admin disabled</h1>
      <div className={styles.bannerWarn} role="status">
        <strong>Set ADMIN_PASSWORD to turn on the admin.</strong>
        Add an <code>ADMIN_PASSWORD</code> environment variable (locally in <code>.env.local</code>, or in the
        Vercel project settings), then restart or redeploy. See <code>docs/CMS.md</code>.
      </div>
    </div>
  );
}
