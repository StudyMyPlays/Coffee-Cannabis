import styles from "../admin.module.css";

export function ReadOnlyBanner() {
  return (
    <div className={styles.bannerWarn} role="alert">
      <strong>Edits can&rsquo;t be saved on this host.</strong>
      This deployment&rsquo;s filesystem is read-only, so saving is turned off. To change gatherings or drinks,
      edit <code>content/gatherings.json</code> / <code>content/drinks.json</code> in GitHub (that redeploys the
      site), run the admin locally, or connect a database adapter. RSVPs and sign-ups on this host are stored
      temporarily and can be lost — see <code>docs/CMS.md</code>.
    </div>
  );
}
