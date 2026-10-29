import { eventDetails, gallery, gamePhotos, trioPhoto } from "@/config/event";
import { available } from "@/lib/photos";
import Hero from "@/components/hero/Hero";
import Trio from "@/components/sections/Trio";
import GameNight from "@/components/sections/GameNight";
import Rsvp from "@/components/sections/Rsvp";
import ScrollFx from "@/components/ui/ScrollFx";

export default function Home() {
  return (
    <>
      <a href="#celebrants" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-deep">
        Skip to content
      </a>
      <main>
        <Hero cardPhoto={available(trioPhoto)?.src ?? null} />
        <Trio photos={gallery.map((g) => available(g.photo))} />
        <GameNight photos={{ kenya50: available(gamePhotos.kenya50), jenga: available(gamePhotos.jenga), darts: available(gamePhotos.darts) }} />
        <Rsvp />
      </main>
      <footer className="bg-ivory px-5 py-10 text-deep sm:py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center">
          <p className="display text-2xl sm:text-3xl">{eventDetails.venue.name}</p>
          <p className="text-sm text-deep/60">
            {eventDetails.date} · {eventDetails.time}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {eventDetails.venue.mapUrl && (
              <a href={eventDetails.venue.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark min-h-11 px-6">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                Open in Google Maps
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            <a href="#top" className="btn btn-ghost-dark min-h-11 px-6">
              Back to the invitation <span aria-hidden="true">↑</span>
            </a>
          </div>
        </div>
      </footer>
      <ScrollFx />
    </>
  );
}
