import { birthdays, eventDetails } from "@/config/event";

const DAYS = 30;
const at = (day: number) => `${((day - 1) / (DAYS - 1)) * 100}%`;
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
/** Keep labels near the ends from spilling off the line. */
const align = (day: number) => (day <= 3 ? "translate-x-0 text-left" : day >= DAYS - 2 ? "-translate-x-full text-right" : "-translate-x-1/2 text-center");

/** A November strip showing all three birthdays (and party night) on one line. */
export default function NovemberTimeline() {
  return (
    <figure className="mx-auto w-full max-w-4xl" aria-label="All three birthdays fall in November">
      <figcaption className="display text-center text-[clamp(1.8rem,3.4vw,3rem)] italic text-rich">November</figcaption>

      <div className="relative mt-6 h-[6.5rem] sm:h-28">
        {/* birthday labels, above the line */}
        {birthdays.map((b) => (
          <div key={b.name} className={`absolute top-0 ${align(b.day)}`} style={{ left: at(b.day) }}>
            <p className="font-serif text-lg leading-none sm:text-xl">{b.name}</p>
            <p className="eyebrow mt-1 text-[0.55rem] text-rich">{ordinal(b.day)} Nov</p>
          </div>
        ))}

        {/* the month line */}
        <div className="absolute inset-x-0 top-[3.6rem] h-px bg-deep/30 sm:top-16" aria-hidden="true">
          {Array.from({ length: DAYS }, (_, i) => i + 1).map((d) => (
            <span
              key={d}
              className={`absolute top-0 w-px -translate-x-1/2 ${d === 1 || d % 5 === 0 ? "h-2.5 bg-deep/45" : "h-1.5 bg-deep/25"}`}
              style={{ left: at(d) }}
            />
          ))}
          {birthdays.map((b) => (
            <span
              key={b.name}
              className="absolute top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-deep ring-4 ring-ivory"
              style={{ left: at(b.day) }}
            />
          ))}
          <span
            className="absolute top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-rich ring-4 ring-ivory"
            style={{ left: at(eventDetails.partyDay) }}
          />
        </div>

        {/* day numbers + party marker, below the line */}
        <div className="absolute inset-x-0 top-[4.4rem] sm:top-[4.9rem]" aria-hidden="true">
          {[1, 10, 20, 30].map((d) => (
            <span key={d} className={`absolute text-[0.65rem] text-deep/45 ${align(d)}`} style={{ left: at(d) }}>
              {d === eventDetails.partyDay ? "" : d}
            </span>
          ))}
        </div>
        <p className={`eyebrow absolute top-[4.4rem] text-[0.55rem] text-rich sm:top-[4.9rem] ${align(eventDetails.partyDay)}`} style={{ left: at(eventDetails.partyDay) }}>
          {ordinal(eventDetails.partyDay)} · Party night
        </p>
      </div>
    </figure>
  );
}
