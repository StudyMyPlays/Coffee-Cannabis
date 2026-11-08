# Coffee & Cannabis Club — website

The digital front door to a members-first Los Angeles community.
Next.js 16 (App Router) · React 19 · TypeScript · deployed on Vercel.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production build
npm test             # unit tests (time/DST, data adapter, validation, admin)
npm run typecheck
npm run lint         # ESLint (Next core-web-vitals + TypeScript rules)
npm run images       # re-optimize brand images after adding/replacing files in /assets
```

Node 20.9+ (tested on 22). Copy `.env.example` to `.env.local` for local settings.

## Deploy to Vercel

1. Import the repo in Vercel (framework preset: Next.js — no custom settings needed).
2. Set environment variables (Project → Settings → Environment Variables), at minimum:
   `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`, `CRON_SECRET`. Optional: `NEXT_PUBLIC_GA_ID`,
   `NOTIFY_WEBHOOK_URL` + `NOTIFY_WEBHOOK_SECRET`, `NEXT_PUBLIC_MOBILE_REQUIRED`.
3. `vercel.json` registers a daily cron (`/api/cron/reminders`) for reminders and scheduled location drops.

> **Important — data persistence.** The site currently runs on the **local adapter**
> (by choice, until a database is picked). Gatherings and drinks live in `content/*.json`
> and deploy with the code. Sign-ups and RSVPs are stored in `.data/` locally, but on
> Vercel they go to temporary storage that is **lost on redeploy and not shared between
> instances**. Connect a database adapter before relying on production sign-ups.
> See `docs/CMS.md` and `src/lib/data/index.ts`.

## Where things live

| What | Where |
| --- | --- |
| Design tokens (color, type, spacing, radii, motion) | `src/styles/tokens.css`, JS motion tokens in `src/lib/motion.ts` |
| Approved copy | `src/lib/site.ts` |
| Homepage sections (Hero → Final Join) | `src/components/sections/` |
| Motion (all GSAP logic, data-attribute driven) | `src/components/motion/MotionController.tsx` |
| Paisley system (SVG components) | `src/components/paisley/` |
| CC monogram (interim vector) | `public/assets/logo/cc-monogram.svg` |
| Data contract + adapters | `src/lib/data/` (`types.ts` is the contract) |
| API routes (join, RSVP, cancel, cron) | `src/app/api/` |
| Team CMS | `/admin` — see `docs/CMS.md` |
| Email/SMS hooks | `src/lib/notify.ts` (webhook out; connect Resend/Twilio/Klaviyo/Zapier) |
| Analytics | `src/lib/analytics.ts` (GA4 when `NEXT_PUBLIC_GA_ID` is set) |

### Analytics events
`cta_click`, `sign_up` (Founding Member join), `join_error`, `rsvp`, `waitlist_join`,
`rsvp_cancel`, `map_interact`, `map_open_directions`, `drink_open`, `green_mile_reveal`.

## Images

Drop source files into `/assets` named after the manifest (any of png/jpg/webp/avif), then
run `npm run images`. Files there take precedence over the original uploads in the repo root.

Manifest: `hero-field`, `texture-parchment`, `texture-green-grain`, `drink-green-goddess`,
`drink-purp`, `drink-gold-drip`, `drink-pink-velvet`, `drink-green-mile`, `community-table`,
`community-dj`, `community-arrival`, `community-hands`, `event-backdrop`, `member-card`,
`og-share`, `paisley-border`. Missing images render as clearly labeled "Photo pending" placeholders.

- `og-share`: a finished file at `/assets/og-share.*` is used as-is. Otherwise the supplied
  paisley-cornered felt artwork (`og-frame`) gets the CC mark + "Find your people." composited on.
- `paisley-border` (the supplied bandana frame) is turned into a gold-only mask
  (`public/assets/pattern/paisley-border-mask.png`) used as the hero accent. The site-wide
  paisley borders, dividers and corners stay vector (`src/components/paisley/`).
Next/Image serves AVIF/WebP with responsive `srcset` automatically.

To replace the logo, overwrite `public/assets/logo/cc-monogram.svg` (single color,
`fill="currentColor"`) and run `npm run images` to regenerate the PNG fallbacks and app icon.

## The Green Mile

The off-menu ritual is revealed by pressing and holding (or tapping / pressing Enter on) the
paisley glyph after the four signature drinks. The copy above it always says a fifth exists,
and it has its own page at `/drinks/green-mile` (not indexed).

## Compliance guardrails built in

- 21+ language in the hero, forms, footer and terms.
- No address is ever hard-coded; the exact address is only sent to the browser after the
  admin flips the release flag or the scheduled release time passes.
- CBD / add-on language is hidden unless "Legal review complete" is ticked per drink.
- Privacy and Terms pages are **drafts for legal review**; the consent text in
  `src/components/join/JoinForm.tsx` (`CONSENT_TEXT`) needs counsel sign-off (TCPA/CAN-SPAM).
