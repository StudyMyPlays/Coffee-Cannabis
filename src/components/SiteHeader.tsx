"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CCMark } from "@/components/ui/CCMark";
import { track } from "@/lib/analytics";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/#gathering", label: "Gathering" },
  { href: "/#rituals", label: "Rituals" },
  { href: "/#community", label: "Community" },
  { href: "/#founding", label: "Members" },
];

const SECTION_IDS = NAV.map((n) => n.href.slice(2));

/**
 * Which homepage section is under the reading line (a band across the middle
 * of the viewport). Null between/outside the nav sections or on other pages.
 */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        setActive(SECTION_IDS.find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => {
      io.disconnect();
      setActive(null);
    };
  }, [enabled]);
  return enabled ? active : null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const active = useActiveSection(pathname === "/");

  // Any route change (including back/forward) closes the mobile menu.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

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

  // Mobile menu: Escape returns focus to the toggle; outside clicks, and
  // growing past the mobile breakpoint, close it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      wide.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  if (pathname?.startsWith("/admin")) return null;

  const closeMenu = () => setMenuOpen(false);
  const navLinks = (onNavigate?: () => void) =>
    NAV.map((item) => {
      const current = active === item.href.slice(2);
      return (
        <li key={item.href}>
          <Link href={item.href} aria-current={current ? "location" : undefined} onClick={onNavigate}>
            {item.label}
          </Link>
        </li>
      );
    });

  return (
    <header ref={headerRef} className={`${styles.header} ${solid || menuOpen ? styles.solid : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.home} aria-label="Coffee & Cannabis Club — home" onClick={closeMenu}>
          <CCMark className={styles.mark} label={null} />
          <span className={styles.wordmark} aria-hidden="true">
            Coffee &amp; Cannabis Club
          </span>
        </Link>
        <nav aria-label="Primary" className={styles.nav}>
          <ul>{navLinks()}</ul>
        </nav>
        <Link
          href="/#join"
          className={`btn ${styles.cta}`}
          onClick={() => {
            closeMenu();
            track("cta_click", { cta: "join_header" });
          }}
        >
          Join the club
        </Link>
        <button
          ref={menuButton}
          type="button"
          className={`${styles.menuButton} ${menuOpen ? styles.menuButtonOpen : ""}`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      <nav
        id="mobile-menu"
        aria-label="Primary (mobile)"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
        inert={!menuOpen}
      >
        <ul>{navLinks(closeMenu)}</ul>
      </nav>
    </header>
  );
}
