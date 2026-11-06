import Link from "next/link";
import { CCMark } from "@/components/ui/CCMark";
import { CONTACT, SOCIAL } from "@/lib/config";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <CCMark className={styles.mark} />
          <p className={styles.city}>Los Angeles, California</p>
        </div>

        <nav aria-label="Social and contact" className={styles.links}>
          <ul>
            <li>
              <a href={SOCIAL.instagram.url} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href={SOCIAL.tiktok.url} target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`}>Contact</a>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.legal}>
          <p>
            <strong>21+ only.</strong> Gatherings are for adults 21 and over; valid ID may be requested at the door.
            Venue rules differ by gathering and are shared with confirmed guests before each event. Nothing on this site
            is an offer to sell cannabis.
          </p>
          <p>© {new Date().getFullYear()} Coffee &amp; Cannabis Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
