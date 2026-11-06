"use client";

/**
 * Single motion controller for the whole site. Presentation components only
 * declare intent via data attributes; all GSAP logic lives here.
 *
 *   data-reveal="up|fade|mask|scale"   one-shot reveal when entering viewport
 *   data-reveal-delay="0.2"            optional delay (s)
 *   data-parallax="0.15"               scrubbed vertical drift (fraction of own height)
 *   data-words                         container of .w spans, scrubbed word reveal
 *   data-pin                           pin element while its scrub runs (desktop only)
 *   data-draw="x|y"                    scrubbed line draw (scaleX/scaleY)
 *   data-tilt                          scrubbed 3D tilt (member card)
 *   data-hero / data-hero-*            hero intro + scroll-out
 *
 * Rules: transform/opacity only; pinning + heavy parallax only on large
 * fine-pointer screens; prefers-reduced-motion → everything static & visible.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";
import { MEDIA, MOTION } from "@/lib/motion";

// GSAP is loaded after hydration (dynamic import) to keep it off the critical path.
let gsap: typeof GSAP;
let ScrollTrigger: typeof ST;

function all<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel) as NodeListOf<T>);
}

function revealVars(el: HTMLElement): { from: gsap.TweenVars; to: gsap.TweenVars } {
  const kind = el.dataset.reveal || "up";
  const from: gsap.TweenVars = { opacity: 0 };
  const to: gsap.TweenVars = { opacity: 1, duration: MOTION.dur.slow, ease: MOTION.ease.out, overwrite: "auto" };
  if (kind === "up") {
    from.y = MOTION.revealDistance;
    to.y = 0;
  } else if (kind === "mask") {
    from.opacity = 1;
    from.clipPath = "inset(100% 0% 0% 0%)";
    to.clipPath = "inset(0% 0% 0% 0%)";
    to.duration = MOTION.dur.intro;
  } else if (kind === "scale") {
    from.scale = 1.06;
    to.scale = 1;
    to.duration = MOTION.dur.intro;
  }
  return { from, to };
}

function setupReveals(reduce: boolean) {
  const els = all("[data-reveal]");
  if (reduce) {
    gsap.set(els, { opacity: 1, clearProps: "transform,clipPath" });
    return;
  }
  // Set every hidden state up front, then reveal in batches as they enter
  // the viewport — a handful of shared observers instead of one per element.
  for (const el of els) gsap.set(el, revealVars(el).from);
  ScrollTrigger.batch(els, {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      (batch as HTMLElement[]).forEach((el, i) => {
        const { to } = revealVars(el);
        gsap.to(el, { ...to, delay: Number(el.dataset.revealDelay || 0) + i * MOTION.stagger });
      }),
  });
}

function setupHero(isDesktop: boolean, reduce: boolean) {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;
  const bg = hero.querySelector("[data-hero-bg]");
  const frame = hero.querySelector("[data-hero-frame]");
  const content = hero.querySelector("[data-hero-content]");
  // The hero intro is pure CSS (Hero.module.css) so the headline paints at
  // first frame without waiting for this script. JS only drives scroll-out.
  if (reduce) return;

  // Scroll-out: the frame opens up and the content lifts away.
  const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true } as const;
  if (bg) gsap.to(bg, { yPercent: isDesktop ? 18 : 8, ease: "none", scrollTrigger: st });
  if (frame) gsap.to(frame, { scale: isDesktop ? 1.1 : 1.04, opacity: 0.25, ease: "none", scrollTrigger: st });
  if (content) gsap.to(content, { yPercent: isDesktop ? -14 : -6, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "75% top" } });
}

function setupParallax(isDesktop: boolean) {
  for (const el of all("[data-parallax]")) {
    const speed = Number(el.dataset.parallax || 0.15) * (isDesktop ? 1 : 0.4);
    gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  }
}

function setupWords(isDesktop: boolean) {
  for (const block of all("[data-words]")) {
    const words = all(".w", block);
    if (!words.length) continue;
    const pinTarget = block.closest<HTMLElement>("[data-pin]");
    const pin = isDesktop && pinTarget ? pinTarget : null;
    gsap.fromTo(
      words,
      { opacity: 0.14 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: pin
          ? { trigger: pin, start: "top top", end: `+=${Math.round(window.innerHeight * 1.4)}`, scrub: 0.6, pin: true, anticipatePin: 1 }
          : { trigger: block, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
      },
    );
  }
}

function setupDraw() {
  for (const el of all("[data-draw]")) {
    const axis = el.dataset.draw === "y" ? "scaleY" : "scaleX";
    gsap.fromTo(
      el,
      { [axis]: 0 },
      {
        [axis]: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 55%", scrub: 0.5 },
      },
    );
  }
}

function setupTilt(isDesktop: boolean) {
  for (const el of all("[data-tilt]")) {
    gsap.fromTo(
      el,
      { rotateX: isDesktop ? 22 : 10, rotateZ: -4, y: 40 },
      {
        rotateX: 0,
        rotateZ: 0,
        y: 0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "center 55%", scrub: true },
      },
    );
  }
}

export function MotionController() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    let mm: ReturnType<typeof GSAP.matchMedia> | null = null;
    let cancelled = false;
    const refresh = () => ScrollTrigger?.refresh();

    (async () => {
      const [{ gsap: g }, { ScrollTrigger: s }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap = g;
      ScrollTrigger = s;
      gsap.registerPlugin(ScrollTrigger);
      mm = gsap.matchMedia();
      mm.add(
      { isDesktop: MEDIA.desktop, reduce: MEDIA.reduce },
      (ctx) => {
        const { isDesktop, reduce } = ctx.conditions as { isDesktop: boolean; reduce: boolean };
        setupReveals(reduce);
        setupHero(isDesktop, reduce);
        if (!reduce) {
          setupParallax(isDesktop);
          setupWords(isDesktop);
          setupDraw();
          setupTilt(isDesktop);
        } else {
          gsap.set(all("[data-words] .w"), { opacity: 1 });
        }
        root.classList.add("motion-ready");
      },
      );
      // Layout can shift once web fonts and lazy images settle.
      document.fonts?.ready.then(refresh).catch(() => {});
    })().catch(() => {
      // Motion is an enhancement: if it fails to load, show everything.
      root.classList.add("motion-failed");
    });

    window.addEventListener("load", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("load", refresh);
      mm?.revert();
    };
  }, [pathname]);

  return null;
}
