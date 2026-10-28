import { gallery, type GalleryItem, type Photo as PhotoT } from "@/config/event";
import { Photo } from "@/components/ui/Photo";
import Chapter from "@/components/ui/Chapter";
import Carousel3D from "@/components/ui/Carousel3D";
import NovemberTimeline from "./NovemberTimeline";

export default function Trio({ photos }: { photos: (PhotoT | null)[] }) {
  const items = gallery.map((g: GalleryItem, i) => ({
    key: g.photo.src,
    label: g.birthday ? `${g.caption} · ${g.birthday}` : g.caption,
    node: (
      <figure className="relative h-full w-full bg-deep p-2 shadow-[0_40px_70px_-30px_rgba(42,6,16,.8)] sm:p-2.5">
        <div className="relative h-full w-full overflow-hidden border-[4px] border-white bg-wine sm:border-[5px]">
          <Photo photo={photos[i]} frameAspect={3 / 2} sizes="(min-width: 640px) 440px, 84vw" monogram={g.monogram} label="Photo coming soon" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(42,6,16,.7),transparent)]" />
          <figcaption className="absolute inset-x-0 bottom-3 text-center text-white">
            <span className="block font-serif text-lg italic">{g.caption}</span>
            {g.birthday && <span className="eyebrow mt-1 block text-[0.52rem] text-silver">{g.birthday}</span>}
          </figcaption>
        </div>
      </figure>
    ),
  }));

  return (
    <section
      id="celebrants"
      aria-label="Our November birthdays"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ivory py-14 text-deep"
    >
      <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-10" data-reveal>
        <Chapter n="01" className="mb-6">The birthday girls</Chapter>
        <NovemberTimeline />
      </div>
      <div className="mt-4" data-reveal>
        <Carousel3D items={items} label="Photos of Clara, Vanessa and Charlene" tone="dark" minItems={6} aspect="aspect-[3/2]" itemClass="w-[min(84vw,calc(var(--stage)*1.1))]" stage="clamp(15rem, 44svh, 26rem)" />
      </div>
    </section>
  );
}
