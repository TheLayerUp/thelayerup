// Turns full-size Instagram reels into tiny looping clips for the homepage hero.
//
//   1. Put the original video (MOV/MP4, any size) in media-src/reels/ (git-ignored).
//   2. Add a line to CLIPS below: which file, and the segment(s) to keep in seconds.
//   3. npm run reels:compress   (needs ffmpeg on PATH)
//   4. List the clip in src/config/showcase.ts.
//
// Output: public/media/reels/<slug>.mp4 (H.264, 540×675, 30 fps, silent, ~0.1–0.5 MB)
// and <slug>.webp (poster; `poster` = seconds into the finished clip), cropped to
// the hero's 4:5 windows. Several segments are joined in order, so dark or
// talking-head stretches in the middle of a reel can be skipped.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const CLIPS = [
  // Glow in the dark, then (skipping the dark gap) lights on: a Zoro coaster in daylight.
  {
    src: "Onepiece Coasters.mov",
    slug: "one-piece-coasters",
    segments: [
      [30.5, 34.0],
      [35.6, 38.6],
    ],
    poster: 5,
  },
  { src: "Wavy Clock.mp4", slug: "wavy-clock", segments: [[14, 20]] },
  { src: "gopuram.mov", slug: "gopuram-glow", segments: [[11, 18]] },
  { src: "lamp.mov", slug: "swirl-lamp", segments: [[17, 23.5]] },
  { src: "order001.mov", slug: "name-sign", segments: [[23.4, 26.2]], poster: 1.5 },
];

const root = process.cwd();
const inDir = path.join(root, "media-src", "reels");
const outDir = path.join(root, "public", "media", "reels");
mkdirSync(outDir, { recursive: true });

// Centre-crop any frame to 4:5, then scale to 540 px wide.
const crop = "crop='min(iw,ih*4/5)':'min(ih,iw*5/4)',scale=540:-2";

for (const c of CLIPS) {
  const input = path.join(inDir, c.src);
  if (!existsSync(input)) {
    console.warn(`skip ${c.slug}: ${c.src} not found in media-src/reels`);
    continue;
  }
  const mp4 = path.join(outDir, `${c.slug}.mp4`);
  const webp = path.join(outDir, `${c.slug}.webp`);

  // trim each segment, then concatenate them into one stream
  const parts = c.segments
    .map(([from, to], i) => `[0:v]trim=start=${from}:end=${to},setpts=PTS-STARTPTS,${crop},fps=30[s${i}]`)
    .join(";");
  const join = c.segments.map((_, i) => `[s${i}]`).join("");
  const graph = `${parts};${join}concat=n=${c.segments.length}:v=1:a=0,format=yuv420p[v]`;

  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    // Seek near the first segment so long reels decode quickly; trim times are then relative.
    "-ss",
    String(Math.max(0, c.segments[0][0] - 1)),
    "-i",
    input,
    "-filter_complex",
    graph.replaceAll(/trim=start=([\d.]+):end=([\d.]+)/g, (_, a, b) => {
      const base = Math.max(0, c.segments[0][0] - 1);
      return `trim=start=${(Number(a) - base).toFixed(3)}:end=${(Number(b) - base).toFixed(3)}`;
    }),
    "-map",
    "[v]",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "28",
    "-profile:v",
    "main",
    "-maxrate",
    "1500k",
    "-bufsize",
    "3000k",
    "-movflags",
    "+faststart",
    "-an",
    mp4,
  ]);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    String(c.poster ?? 0.5),
    "-i",
    mp4,
    "-frames:v",
    "1",
    "-quality",
    "75",
    webp,
  ]);
  console.log(
    `${c.slug}: ${(statSync(mp4).size / 1024).toFixed(0)} KB video, ${(statSync(webp).size / 1024).toFixed(0)} KB poster`
  );
}
