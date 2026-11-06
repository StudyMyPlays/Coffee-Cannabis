"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CCMark } from "@/components/ui/CCMark";
import { track } from "@/lib/analytics";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/#gathering", label: "Gathering" },
  { href: "/#rituals", label: "Rituals" },
  { href: "/#community", label: "Community" },
  { href: "/#founding", label: "Members" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSolid(window.scrollY > window.innerHeight * 0.6));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className={`${styles.header} ${solid ? styles.solid : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.home} aria-label="Coffee & Cannabis Club — home">
          <CCMark className={styles.mark} label={null} />
          <span className={styles.wordmark} aria-hidden="true">
            Coffee &amp; Cannabis Club
          </span>
        </Link>
        <nav aria-label="Primary" className={styles.nav}>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/#join"
          className={`btn ${styles.cta}`}
          onClick={() => track("cta_click", { cta: "join_header" })}
        >
          Join the club
        </Link>
      </div>
    </header>
  );
}
