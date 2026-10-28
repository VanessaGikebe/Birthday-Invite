# Trio 21st — Birthday Game Night Invitation

A 3D birthday invitation built with Next.js 16, React Three Fiber, GSAP and Tailwind CSS. RSVPs are stored in Supabase,
and the hosts get a private dashboard.

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
currently a placeholder. Guests tap **Yes, I'm in** to reach the form, or **Not this time** for a friendly message.

## Run locally

```bash
npm install
cp .env.example .env.local   # then set HOST_PASSWORD (Supabase optional locally)
npm run dev                  # http://localhost:3000
```

Without Supabase, development mode stores RSVPs in `.data/rsvps.json`.

- **Host dashboard:** http://localhost:3000/host
- **2D fallback preview:** http://localhost:3000/?flat shows what browsers without WebGL see.

## Environment variables

| Variable                    | Required    | Purpose                                                                |
| --------------------------- | ----------- | ---------------------------------------------------------------------- |
| `SUPABASE_URL`              | Production  | Supabase project URL                                                   |
| `SUPABASE_SERVICE_ROLE_KEY` | Production  | Server-only key used to read and write RSVPs. Never expose it publicly. |
| `HOST_PASSWORD`             | Yes         | Password for `/host`                                                   |
| `HOST_SESSION_SECRET`       | Optional    | Signs the host cookie. Defaults to `HOST_PASSWORD`.                    |
| `RSVP_STORAGE=file`         | Optional    | Forces JSON-file storage, only for a self-hosted server with a persistent disk |

If Supabase isn't configured in production, the RSVP form shows an error. It never pretends a response was saved.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste in `supabase/schema.sql` and run it. This creates the `rsvps` table, a unique index that
   blocks duplicate names, and Row Level Security with no public policies, so the guest list is never readable from
   the browser.
3. Copy the **Project URL** and the **service_role** key from **Project Settings → API**.

## Deploy (Vercel)

1. Push this folder to a GitHub repository.
2. Import it at [vercel.com/new](https://vercel.com/new). The framework is detected automatically.
3. Add the environment variables above under **Settings → Environment Variables**.
4. Deploy, then share the URL. After you add or replace photos, redeploy, because the homepage is pre-rendered.

Any Node host that runs `npm run build && npm start` also works, for example Netlify, Render or Railway.

## How it's built

| Path                                | What                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/components/hero/`              | The R3F envelope and its GSAP opening timeline, plus a CSS-only 2D fallback |
| `src/components/ui/Carousel3D.tsx`  | The rotating 3D carousel used for the photos and the games |
| `src/components/games/`             | The Star PowerPoint Night (Hot Takes) slide deck and hot-take generator |
| `src/components/sections/`          | Page sections                                                     |
| `src/app/api/rsvp`                  | RSVP endpoint: validation (zod), rate limit, honeypot, duplicate protection |
| `src/app/host`                      | Password-protected dashboard: search, filter, delete, CSV export  |

The site respects `prefers-reduced-motion`, and the 3D scene pauses rendering when it is off screen.
