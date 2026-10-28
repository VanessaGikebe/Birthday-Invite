import { celebrantNames, eventDetails, gallery, gamePhotos, trioPhoto } from "@/config/event";
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
      <footer className="bg-ivory px-5 py-14 text-deep sm:px-10">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="display text-5xl italic">
              {eventDetails.age} × 3
            </p>
            <p className="eyebrow mt-4 text-[0.6rem] text-deep/60">{celebrantNames("  ·  ")}</p>
          </div>
          <div className="text-sm text-deep/60 sm:text-right">
            <p className="font-serif text-lg italic text-deep">See you at {eventDetails.venue.name}.</p>
            <p className="mt-1">
              {eventDetails.date} · {eventDetails.time}
            </p>
            <a href="#top" className="eyebrow mt-4 inline-block text-[0.6rem] text-rich hover:underline">
              Back to the invitation ↑
            </a>
          </div>
        </div>
      </footer>
      <ScrollFx />
    </>
  );
}
