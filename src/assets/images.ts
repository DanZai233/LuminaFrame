/**
 * Sample photo assets.
 *
 * Imported through Vite so the bundler fingerprints each file and rewrites the
 * URL to the emitted `dist/assets/...` path. Never reference these files with a
 * hard-coded string such as `/src/assets/images/foo.jpg` — that path only exists
 * inside the dev server and 404s in any production build (Vercel, Netlify, ...).
 */
import xpanStreetUrl from './images/sample_xpan_street_1791190366054.jpg';
import mountainMistUrl from './images/sample_mountain_mist_1791190375650.jpg';
import vintageCafeUrl from './images/sample_vintage_cafe_1791190384888.jpg';
import urbanArchitectureUrl from './images/sample_urban_architecture_1791190393766.jpg';

// Lightweight WebP derivatives used by the thumbnail rail in the picker. The
// originals are 0.6–1.1 MB each; the 320px previews below are ~4–19 KB.
import xpanStreetThumb from './images/thumbs/sample_xpan_street_1791190366054.webp';
import mountainMistThumb from './images/thumbs/sample_mountain_mist_1791190375650.webp';
import vintageCafeThumb from './images/thumbs/sample_vintage_cafe_1791190384888.webp';
import urbanArchitectureThumb from './images/thumbs/sample_urban_architecture_1791190393766.webp';

export const SAMPLE_IMAGE_URLS = {
  xpanStreet: xpanStreetUrl,
  mountainMist: mountainMistUrl,
  vintageCafe: vintageCafeUrl,
  urbanArchitecture: urbanArchitectureUrl,
} as const;

export const SAMPLE_IMAGE_THUMBS = {
  xpanStreet: xpanStreetThumb,
  mountainMist: mountainMistThumb,
  vintageCafe: vintageCafeThumb,
  urbanArchitecture: urbanArchitectureThumb,
} as const;
