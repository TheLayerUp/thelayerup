// Instagram clips shown as the floating "windows" in the homepage hero.
//
// To add one:
//   1. Put the original reel (MOV/MP4, any size) in media-src/reels/ (git-ignored, never deployed).
//   2. Add it to CLIPS in scripts/compress-reels.mjs (start time + length of the best moment).
//   3. npm run reels:compress  → public/media/reels/<slug>.mp4 + .webp (a few hundred KB).
//   4. Add an entry below with `reel(slug, caption)`.
//
// Videos never block the page: only posters load up front, and a clip starts
// downloading when it scrolls into view (never on Save-Data or reduced motion).
// With an empty list, the hero falls back to featured product photos with a CSS timelapse.

import { site } from "./site";

export type Reel = {
  /** Poster image shown before (or instead of) the video. Required. */
  poster: string;
  /** Optional MP4. Leave out to show a still. */
  video?: string;
  caption: string;
  /** Link to the Instagram post, or a product page. */
  href?: string;
};

// Each window links to the Instagram profile; set `href` to a post URL or a
// product page (e.g. "/products/moon-lamp-mini") to send people somewhere more specific.
const reel = (slug: string, caption: string, href: string = site.social.instagram): Reel => ({
  poster: `/media/reels/${slug}.webp`,
  video: `/media/reels/${slug}.mp4`,
  caption,
  href,
});

export const reels: Reel[] = [
  reel("swirl-lamp", "Swirl Lamp"),
  reel("one-piece-coasters", "One Piece Coasters"),
  reel("gopuram-glow", "Gopuram Glow"),
  reel("wavy-clock", "Wavy Clock"),
  reel("name-sign", "Name Sign"),
];
