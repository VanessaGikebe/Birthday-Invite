# Trio 21st — Birthday Game Night Invitation

A 3D birthday invitation built with Next.js 16, React Three Fiber, GSAP and Tailwind CSS. Every RSVP is
saved straight to the hosts' Google Sheet.

## Personalise it

Everything editable lives in **`src/config/event.ts`**: names, taglines, fun facts, date, time, venue, contribution,
spa note and the maximum party size per RSVP.

### Photos

Save the photos into **`public/photos/`** with these exact names:

| File              | What                                                    |
| ----------------- | ------------------------------------------------------- |
| `clara.jpg`       | Clara                                                   |
| `vanessa.jpg`     | Vanessa                                                 |
| `charlene.jpg`    | Charlene. Use the upright landscape version.            |
| `trio.jpg`        | The three of you together                               |
| `kenya-at-50.jpg` | The Kenya at 50 (Fifty-Fifty) game box                  |
| `jenga.jpg`       | The Jenga tower                                         |

If a file is missing, a burgundy monogram placeholder is shown instead. To add more photos to the 3D carousel, add
entries to `gallery` in the config.

### Contribution

The RSVP section shows the KSh 1,850 contribution first. Set the M-Pesa number in `contribution.payTo.number`; it is
Guests tap **Yes, I'm in** to reach the form, or **Not this time** for a friendly message.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the two Google Sheet values
npm run dev                  # http://localhost:3000
```

To preview the 2D fallback (what browsers without WebGL see), open http://localhost:3000/?flat.

## Environment variables

| Variable            | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `RSVP_SHEET_URL`    | The Apps Script Web app URL (ends in `/exec`)                 |
| `RSVP_SHEET_SECRET` | The same phrase as `SECRET` in the Apps Script                |

If these aren't set, the RSVP form shows an error. It never pretends a response was saved.

## RSVPs in a Google Sheet

Every RSVP becomes a new row in a Google Sheet you own, in a tab called **RSVPs**.

1. Create a new Google Sheet (any name).
2. In the sheet, open **Extensions → Apps Script**.
3. Delete what's there, paste in all of `google-apps-script/rsvp.gs`, and change `SECRET` to a long random phrase.
4. Click **Save**, then **Deploy → New deployment**. Choose the type **Web app**, set **Execute as: Me** and
   **Who has access: Anyone**, then click **Deploy**.
5. Authorise it when Google asks. On the "Google hasn't verified this app" screen, click **Advanced → Go to … (unsafe)**;
   it's your own script.
6. Copy the **Web app URL** (it ends in `/exec`).
7. Set `RSVP_SHEET_URL` and `RSVP_SHEET_SECRET` (`.env.local` locally, Vercel → Environment Variables when deployed).
8. Restart the site and send a test RSVP. The row appears in the **RSVPs** tab.

If you edit the script later, use **Deploy → Manage deployments → Edit → New version**, so the URL stays the same.

## Deploy (Vercel)

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new). The framework is detected automatically.
2. Add `RSVP_SHEET_URL` and `RSVP_SHEET_SECRET` under **Settings → Environment Variables**.
3. Deploy, then share the URL. After you add or replace photos, redeploy, because the homepage is pre-rendered.

## How it's built

| Path                                | What                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/components/hero/`              | The R3F envelope and its GSAP opening timeline, plus a CSS-only 2D fallback |
| `src/components/ui/Carousel3D.tsx`  | The rotating 3D carousel used for the photos and the games |
| `src/components/games/`             | The Star PowerPoint Night (Hot Takes) slide deck and hot-take generator |
| `src/components/sections/`          | Page sections                                                     |
| `src/app/api/rsvp`                  | RSVP endpoint: validation (zod), rate limit, honeypot; saves to the Google Sheet |
| `google-apps-script/rsvp.gs`        | The Apps Script that writes RSVPs into the sheet (blocks duplicate names) |

The site respects `prefers-reduced-motion`, and the 3D scene pauses rendering when it is off screen.
