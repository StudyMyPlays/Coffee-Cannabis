# Coffee & Cannabis Club — Team CMS guide

This is the guide for the team. You don't need a developer for everyday
updates. There is one important limitation, covered in
[Where data lives](#where-data-lives-read-this). Read that section before you
take real sign-ups.

---

## 1. Signing in

1. Go to **`/admin`** on the site (for example `https://yourdomain.com/admin`).
2. Enter the shared **team password**. Sessions last **12 hours**. Use
   **Sign out** (top right) on shared computers.

If the page says **"Admin disabled: set ADMIN_PASSWORD"**, the password
hasn't been configured. Set `ADMIN_PASSWORD` in Vercel → Project → Settings →
Environment Variables (or in `.env.local` when running locally), then redeploy
or restart.

To change the password, update `ADMIN_PASSWORD` and redeploy. Everyone is
signed out automatically.

The admin is hidden from search engines (`noindex`).

---

## 2. Gatherings

### Create one
Dashboard → **New gathering**. It starts as a **Draft**, which is invisible on
the site, so you can prepare it calmly.

| Field | What it does |
|---|---|
| Gathering number / Title / Slug | "Gathering No. 02", URL name `gathering-02`. The number and slug must be unique. |
| Description | Short and warm: drinks, music, people. **No health, wellness or consumption claims.** |
| Status | **Draft** = hidden. **Upcoming** = live, RSVPs open. **Past** = archive. **Cancelled** = RSVPs closed. |
| Capacity | Confirmed spots. After that, guests join the **waitlist** automatically. |
| Starts / Ends | **Los Angeles time.** Daylight saving is handled for you. |
| Neighborhood | Shown publicly. Leave it blank to show **"Neighborhood: TBA"**. The map lat/lng is an *approximate neighborhood center*, never the venue. |
| Venue address + venue lat/lng | **Private.** Hidden until you release it (see below). |
| Drink of the gathering | Pick one from the menu. |
| Sample content | Shows a discreet "sample" label. Turn it off once the details are real. |
| Recap | Fill this in after the night. Quotes go one per line as `Quote — Name`. Photos go one per line as `image path or URL \| description`. |

Once a gathering's end time has passed, it moves into the archive
automatically, even while its status is still "Upcoming". Set it to **Past**
to make that explicit.

### Releasing the address
You have two options. Use either one, or both:

- **Release now (flag):** tick **"Release the address now"** and save. The
  address appears on the site immediately, and a **location drop**
  notification goes to confirmed guests.
- **Scheduled release:** set **"Or release automatically at"** to a
  Los Angeles time. The site shows the address from that moment. The daily
  job (`/api/cron/reminders`) sends the location drop on its next run after
  that time. It runs once a day at about 9–10am PT, so the email can arrive up
  to a day after the address appears on the site. If you want the email to go
  out at the exact moment, use the flag instead.

You can't release the address until it has been entered. The location drop is
sent only once per gathering.

### Reminders
The daily job sends a **reminder** to confirmed guests of any gathering that
starts 24–48 hours later.

### RSVPs
Each gathering's edit page lists its RSVPs (name, email, status, time) and has
a **Download CSV** button. When a confirmed guest cancels using their link,
the earliest person on the waitlist is promoted and notified.

> If you **raise capacity** after the waitlist has filled, waitlisted guests
> are **not** promoted automatically. Contact them yourselves, or ask them to
> RSVP again after cancelling.

---

## 3. Drinks

- **Founding Five** (Green Goddess™, Purp Drink™, Gold Drip™, Pink Velvet™,
  Green Mile™) are permanent. You can edit them, but you can't delete them.
- **New seasonal drink** (Dashboard) creates a drink that starts out
  **inactive**. Tick **Active** when it's ready to show.
- **Secret** hides a drink from the menu so the site reveals it through an
  interaction (Green Mile).
- **Order** controls position. Lower numbers come first.
- **Image**: an asset name such as `drink-green-goddess`, or a full image URL.
  Always add an image description.
- **Accent color**: a hex color such as `#8db35a`.
- To retire a seasonal drink, untick **Active** (you can bring it back
  later), or **Delete** it (permanent). You can't delete a drink while it's
  set as the drink of a gathering.

Copy guidelines: write about taste, texture and mood only. No health,
wellness, energy or medical claims, and no cannabis consumption claims.

### Add-on language (legal review flag)
The **Add-on note** field (for example "Optional CBD add-on available where
permitted.") **never appears on the site** until someone ticks **"Legal review
complete — publish add-on language"**. If you change the wording later, untick
the box and get the new wording reviewed before you tick it again.

---

## Where data lives (read this)

The site runs on a **local file adapter** for now. No database is connected.

| Data | Stored in | Locally | On Vercel |
|---|---|---|---|
| Gatherings, drinks (content) | `content/gatherings.json`, `content/drinks.json` (in Git) | Editable in `/admin` | **Read-only**: saving in the admin is disabled and a banner explains why |
| Founding members, RSVPs (runtime) | `.data/members.json`, `.data/rsvps.json` (never committed) | Persistent on that computer | **EPHEMERAL**: written to the server's temp folder |

### On Vercel, content edits must come through Git
Vercel's filesystem is read-only, so the admin can't save there. To change
content on the live site, do one of the following:

1. **GitHub web editor:** open `content/gatherings.json` or
   `content/drinks.json` on GitHub, click the pencil, edit, and commit. Vercel
   redeploys automatically within a minute or two. Keep the JSON valid. Copy
   an existing entry as a template. Times use the `"YYYY-MM-DDTHH:mm"`
   format, in Los Angeles time.
2. **Locally:** run the site on a computer (`npm run dev`), edit in `/admin`
   (it saves to `content/*.json`), then commit and push.

### On Vercel, RSVPs and sign-ups are EPHEMERAL
Until a database adapter is connected, founding-member sign-ups and RSVPs
submitted on the live site are stored in temporary server storage:

- They are **lost** on every redeploy and whenever the server instance
  recycles, which can happen at any time.
- They are **not shared** between server instances, so counts can disagree,
  and capacity limits are enforced only within one instance.
- Deduplication and the "already sent" markers for reminders and location
  drops are also temporary.

**Do not rely on the live site for real RSVPs or member sign-ups until a
database adapter is connected.** In the meantime, connect
`NOTIFY_WEBHOOK_URL` (for example to a Zapier hook that appends every event
to a Google Sheet). The webhook then becomes your durable record, because
every sign-up and RSVP is sent there as it happens.

Connecting a database means a developer implements the `DataAdapter`
interface (`src/lib/data/types.ts`). There's a stub in `src/lib/data/index.ts`
showing where a Supabase adapter plugs in, plus `DATA_ADAPTER=supabase`. The
UI and API don't change.

---

## Exporting members and RSVPs

While signed in to the admin:

- **Members:** Dashboard → **Download members (CSV)**, or open
  `/admin/export/members`.
- **RSVPs for one gathering:** that gathering's page → **Download CSV**.
- **All RSVPs:** `/admin/export/rsvps`.

CSV files open in Excel, Numbers or Google Sheets. Locally, the raw files are
also available in `.data/`.

---

## Notifications

The site emits these events: `member.welcome`, `rsvp.confirmed`,
`rsvp.waitlisted`, `rsvp.promoted`, `rsvp.cancelled`,
`gathering.location_drop`, `gathering.reminder`, `gathering.updated`.

- When `NOTIFY_WEBHOOK_URL` is set, each event is POSTed as JSON
  `{ event, payload, sentAt }`. If `NOTIFY_WEBHOOK_SECRET` is also set, the
  request carries the header `x-ccc-signature: sha256=<HMAC>`.
- When it isn't set, events are only written to the server logs. **No emails
  are sent.**
- RSVP emails should include `payload.cancelUrl`, which is each guest's
  private cancel link.
- `gathering.updated` fires on any admin save that changes a gathering, and
  lists the changed fields and the guests. Your automation decides whether a
  change is worth emailing about.
- Connecting Resend, Twilio, Klaviyo or Zapier is covered in the comment at
  the top of `src/lib/notify.ts`.

---

## Environment variables

All of them are listed with comments in **`.env.example`**.

| Variable | Needed for |
|---|---|
| `ADMIN_PASSWORD` | Turning on `/admin` |
| `ADMIN_SESSION_SECRET` | Optional, hardens admin cookies |
| `NEXT_PUBLIC_SITE_URL` | Correct links in notifications |
| `NEXT_PUBLIC_MOBILE_REQUIRED` | Making the mobile number required on sign-up |
| `DATA_ADAPTER` | `local` (default) |
| `NOTIFY_WEBHOOK_URL`, `NOTIFY_WEBHOOK_SECRET` | Emails/SMS via your automation |
| `CRON_SECRET` | The daily reminder/location-drop job (`vercel.json`) |
| `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile bot check |
| `NEXT_PUBLIC_GA_ID` | Optional analytics |

Rate limits (5 sign-ups and 8 RSVPs per 10 minutes per IP) are kept in memory
per server instance. For stricter global limits, a developer can switch them
to Upstash or Vercel KV (`src/lib/spam.ts`).
