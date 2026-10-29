/**
 * ─────────────────────────────────────────────────────────────────────────
 *  EVENT CONFIGURATION — edit this file to personalise the invitation.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  PHOTOS live in /public/photos. Save your images with these exact names:
 *
 *    clara.jpg         Clara
 *    vanessa.jpg       Vanessa
 *    charlene.jpg      Charlene
 *    trio.jpg          the three of you together
 *    kenya-at-50.jpg   the Kenya at 50 / Fifty-Fifty game box
 *    jenga.jpg         the Jenga tower
 *    darts.jpg         the dartboard
 *
 *  Any photo that's missing is replaced by an elegant monogram placeholder.
 *  Want more photos in the carousel? Add entries to `gallery` below.
 *
 *  Everything marked PLACEHOLDER should be replaced before sending the link.
 */

/** Crop window inside a photo: x/y = face centre (0–1), zoom = how close. */
export type PhotoCrop = { x: number; y: number; zoom: number };

export type Photo = {
  src: string;
  alt: string;
  /** Natural width / height of the image file — only needed for crops. */
  aspect: number;
  crop?: PhotoCrop;
};

export const celebrants = ["Clara", "Vanessa", "Charlene"];

/** Birthdays — all in November. Drives the timeline on the birthday-girls page. */
export const birthdays = [
  { name: "Clara", day: 1 },
  { name: "Vanessa", day: 19 },
  { name: "Charlene", day: 29 },
];

export type GalleryItem = { photo: Photo; caption: string; birthday?: string; monogram: string };

/** The rotating 3D photo carousel (landscape frames). Order = order around the ring. */
export const gallery: GalleryItem[] = [
  {
    // Portrait selfie — the crop keeps her face in the landscape frame.
    photo: { src: "/photos/clara.jpg", alt: "Clara", aspect: 960 / 1280, crop: { x: 0.47, y: 0.41, zoom: 1 } },
    caption: "Clara",
    birthday: "1st November",
    monogram: "Cl",
  },
  {
    photo: { src: "/photos/vanessa.jpg", alt: "Vanessa", aspect: 1280 / 720, crop: { x: 0.56, y: 0.3, zoom: 1 } },
    caption: "Vanessa",
    birthday: "19th November",
    monogram: "V",
  },
  {
    photo: { src: "/photos/charlene.jpg", alt: "Charlene", aspect: 1471 / 829, crop: { x: 0.47, y: 0.45, zoom: 1 } },
    caption: "Charlene",
    birthday: "29th November",
    monogram: "C",
  },
];

/** The group photo — also the background of the letter inside the envelope. */
export const trioPhoto: Photo = { src: "/photos/trio.jpg", alt: "Clara, Vanessa and Charlene together", aspect: 1 };

export const gamePhotos = {
  kenya50: { src: "/photos/kenya-at-50.jpg", alt: "The cover of the Fifty-Fifty Kenya in 50 Seconds board game", aspect: 880 / 1257 },
  jenga: { src: "/photos/jenga.jpg", alt: "A wooden Jenga tower with blocks tumbling off it", aspect: 1000 / 1500, crop: { x: 0.5, y: 0.45, zoom: 1 } },
  darts: { src: "/photos/darts.jpg", alt: "A dartboard with darts around the bullseye", aspect: 1024 / 640, crop: { x: 0.53, y: 0.5, zoom: 1 } },
} satisfies Record<string, Photo>;

export const eventDetails = {
  /** The age being celebrated — drives the big "21" motif. */
  age: 21,
  eyebrow: "21st Birthday × Game Night",
  /** The letter inside the envelope. */
  letter: {
    greeting: "Hello dia,",
    message: "You are invited to our 21st birthday game night",
    signOff: "With love, Clara, Vanessa & Charlene",
  },
  headline: ["Three birthdays.", "One game night."],
  date: "Friday 20th November",
  /** Day of November the party falls on (marked on the birthday timeline). */
  partyDay: 20,
  time: "3 PM till Saturday 10 AM",
  venue: {
    name: "Redhill Container House",
    /** Optional Google Maps link. null hides the "Get directions" link. */
    mapUrl: "https://maps.app.goo.gl/4brDpzD4YtvSvcby9?g_st=ic" as string | null,
  },
  /** e.g. "Kindly RSVP by 15 November". null hides it. */
  rsvpBy: "Kindly RSVP as soon as you can" as string | null,
};

export const contribution = {
  currency: "KSh",
  amount: 1850,
  includes: ["Food", "Venue", "Drinks"],
  /** Where guests send the contribution. */
  payTo: {
    method: "M-Pesa",
    /** The number guests send money to. */
    number: "0797 166 836",
    /** Optional name shown on M-Pesa, e.g. "Vanessa W." — null hides it. */
    name: "Vanessa Gikebe" as string | null,
  },
};

export const rsvpConfig = {
  /** Maximum number of people one RSVP can cover (including the guest). */
  maxAttendees: 6,
};

export const site = {
  title: "Three Birthdays. One Game Night.",
  description:
    "Clara, Vanessa & Charlene turn 21 — a game night at Redhill Container House: Kenya at 50, Jenga, cards and a Star PowerPoint Night of hot takes.",
};

export const celebrantNames = (sep = " · ") => celebrants.join(sep);
