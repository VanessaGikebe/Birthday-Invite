import type { Photo as PhotoT } from "@/config/event";
import Chapter from "@/components/ui/Chapter";
import Carousel3D from "@/components/ui/Carousel3D";
import { Photo } from "@/components/ui/Photo";
import PowerPointNight from "@/components/games/PowerPointNight";

function Panel({ title, line, children }: { title: string; line: string; children: React.ReactNode }) {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-deep shadow-[0_40px_70px_-30px_rgba(0,0,0,.75)]">
      <div className="relative flex-1 overflow-hidden bg-deep">
        {children}
        {/* glossy light sweep across the cover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{
            background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.55) 45%, rgba(217,213,214,.35) 50%, transparent 62%)",
            backgroundSize: "250% 100%",
            animation: "shimmer 5.5s linear infinite",
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.12)_48%,transparent_60%)]" />
      </div>
      <div className="px-4 py-3">
        <h3 className="display text-2xl">{title}</h3>
        <p className="mt-0.5 text-xs text-deep/65">{line}</p>
      </div>
    </article>
  );
}

const KenyaArt = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(160deg,var(--color-rich),var(--color-deep))] text-white">
    <div className="absolute inset-x-0 top-[36%] h-[24%] -skew-y-6 bg-white/90" />
    <span className="display relative text-[6rem] text-deep">50</span>
    <span className="eyebrow relative mt-8 text-[0.55rem]">Kenya in 50 seconds</span>
  </div>
);

const JengaArt = () => (
  <div className="absolute inset-0 flex items-end justify-center bg-[radial-gradient(80%_70%_at_50%_30%,var(--color-rich),var(--color-deep))] pb-6">
    <div className="flex w-24 flex-col-reverse gap-[3px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={`flex h-4 gap-[3px] ${i === 7 ? "translate-x-5" : ""}`}>
          {i % 2 === 0 ? (
            [0, 1, 2].map((j) => <span key={j} className="flex-1 rounded-[2px] bg-ivory shadow-[inset_0_-2px_0_rgba(91,16,37,.2)]" />)
          ) : (
            <span className="flex-1 rounded-[2px] bg-[repeating-linear-gradient(90deg,#FAF7F4_0_6px,#efe6e0_6px_8px)] shadow-[inset_0_-2px_0_rgba(91,16,37,.2)]" />
          )}
        </div>
      ))}
    </div>
  </div>
);

const DartsArt = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(80%_70%_at_50%_40%,var(--color-rich),var(--color-deep))]">
    <div className="relative h-36 w-36 rounded-full bg-[repeating-conic-gradient(var(--color-ivory)_0_18deg,var(--color-ink)_18deg_36deg)] ring-8 ring-ink shadow-xl">
      <span className="absolute inset-[30%] rounded-full bg-[repeating-conic-gradient(var(--color-rich)_0_18deg,var(--color-ivory)_18deg_36deg)]" />
      <span className="absolute inset-[45%] rounded-full bg-rich ring-2 ring-ivory" />
    </div>
  </div>
);

const CardsArt = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(80%_70%_at_50%_40%,var(--color-rich),var(--color-deep))]">
    {[
      ["A", "♥", -18],
      ["21", "♠", 0],
      ["K", "♦", 18],
    ].map(([rank, suit, rot], i) => (
      <div
        key={i}
        className="absolute flex h-32 w-[5.5rem] origin-bottom flex-col justify-between rounded-lg bg-white p-2 font-serif text-deep shadow-lg"
        style={{ transform: `rotate(${rot}deg) translateY(-6px)` }}
      >
        <span className="text-sm leading-none">
          {rank}
          <span className="block text-rich">{suit}</span>
        </span>
        <span className="self-center text-3xl text-rich">{suit}</span>
        <span className="rotate-180 text-sm leading-none">{rank}</span>
      </div>
    ))}
  </div>
);

const PptArt = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(80%_70%_at_50%_40%,var(--color-rich),var(--color-deep))] p-5">
    <div className="w-full rounded-md bg-silver p-1.5 shadow-xl">
      <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-sm bg-[radial-gradient(120%_100%_at_30%_20%,#8B263F,#5B1025_70%)] text-center text-white">
        <span className="eyebrow text-[0.45rem] text-silver">Theme</span>
        <span className="display mt-1 text-3xl italic">Hot Takes</span>
      </div>
    </div>
  </div>
);

export default function GameNight({ photos }: { photos: { kenya50: PhotoT | null; jenga: PhotoT | null; darts: PhotoT | null } }) {
  const games = [
    {
      key: "kenya",
      label: "Kenya at 50",
      node: (
        <Panel title="Kenya at 50" line="Fifty seconds. Very Kenyan words.">
          {photos.kenya50 ? <Photo photo={photos.kenya50} frameAspect={0.9} sizes="300px" /> : <KenyaArt />}
        </Panel>
      ),
    },
    {
      key: "jenga",
      label: "Jenga",
      node: (
        <Panel title="Jenga" line="Steady hands, loud opinions.">
          {photos.jenga ? <Photo photo={photos.jenga} frameAspect={0.9} sizes="300px" /> : <JengaArt />}
        </Panel>
      ),
    },
    {
      key: "darts",
      label: "Darts",
      node: (
        <Panel title="Darts" line="Aim for the bullseye. Settle for the board.">
          {photos.darts ? <Photo photo={photos.darts} frameAspect={0.9} sizes="300px" /> : <DartsArt />}
        </Panel>
      ),
    },
    {
      key: "cards",
      label: "Cards",
      node: (
        <Panel title="Cards" line="Kadi, poker faces & blackjack — 21, obviously.">
          <CardsArt />
        </Panel>
      ),
    },
    {
      key: "ppt",
      label: "PowerPoint Night",
      node: (
        <Panel title="PowerPoint Night" line="The headline act. Theme: hot takes.">
          <PptArt />
        </Panel>
      ),
    },
  ];

  return (
    <>
      <section id="game-night" aria-labelledby="game-night-title" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-deep py-14 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,rgba(139,38,63,.7),transparent),radial-gradient(50%_40%_at_0%_100%,rgba(42,6,16,.8),transparent)]" />
        <div className="relative mx-auto max-w-[90rem] px-5 sm:px-10">
          <div className="grid items-end gap-4 md:grid-cols-12" data-reveal>
            <div className="md:col-span-8">
              <Chapter n="02" className="text-silver">
                The main event
              </Chapter>
              <h2 id="game-night-title" className="display mt-4 text-[clamp(2.6rem,5.4vw,4.8rem)]">
                Game <span className="italic text-silver">Night.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/75 md:col-span-4 md:justify-self-end">
              Kenya at 50, Jenga, darts, cards — and a PowerPoint showdown to close the night. Bring your competitive streak.
            </p>
          </div>
        </div>
        <div className="relative mt-6" data-reveal>
          <Carousel3D items={games} label="Game night line-up" minItems={10} speed={12} itemClass="w-[min(64vw,calc(var(--stage)*0.64))]" aspect="aspect-[4/5]" />
        </div>
      </section>

      {/* Star PowerPoint Presentation Night — Hot Takes */}
      <section
        id="powerpoint"
        aria-labelledby="ppt-title"
        className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ivory py-14 text-deep"
      >
        <div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-10">
          <PowerPointNight
            intro={
              <div data-reveal>
                <p className="eyebrow text-[0.62rem] text-rich">The headline act</p>
                <h2 id="ppt-title" className="display mt-4 text-[clamp(2.2rem,4.2vw,3.9rem)]">
                  Star <span className="italic text-rich">PowerPoint</span> Presentation Night
                </h2>
                <p className="mt-5 inline-flex items-center gap-3 rounded-full bg-deep px-5 py-2 text-white">
                  <span className="eyebrow text-[0.55rem] text-silver">Theme</span>
                  <span className="display text-2xl italic">Hot Takes</span>
                </p>
                <blockquote className="mt-5 max-w-xl font-serif text-[clamp(1.05rem,1.5vw,1.3rem)] italic leading-snug text-deep/80">
                  &ldquo;Your most unnecessary opinions deserve a PowerPoint. Bring your wildest ideas, your most questionable
                  arguments, and your main-character energy.&rdquo;
                </blockquote>
              </div>
            }
          />
        </div>
      </section>
    </>
  );
}
