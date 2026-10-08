/**
 * Rotation helpers shared by the canvas exporter and the live preview.
 *
 * The whole app models a rotated photo as "the crop cell stays axis-aligned and
 * the photo is turned inside it". Turning a rectangle inside an equally sized
 * cell always exposes empty corners, so both the exporter and the preview scale
 * the drawing by `rotationCoverScale()` before rotating it and then clip to the
 * cell. Keeping the formula here guarantees the preview and the exported bitmap
 * agree pixel for pixel.
 */

/** Normalise any angle into [0, 360). */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * The tilt component of an angle: how far it sits from the nearest right angle,
 * in (-45, 45]. `90` -> `0`, `96.5` -> `6.5`, `270` -> `0`, `-3` -> `-3`.
 */
export function rotationTilt(deg: number): number {
  const withinQuadrant = ((deg % 90) + 90) % 90; // 0..90
  return withinQuadrant > 45 ? withinQuadrant - 90 : withinQuadrant;
}

/** Replace only the tilt part of `deg`, keeping its right-angle base. */
export function withRotationTilt(deg: number, tilt: number): number {
  return deg - rotationTilt(deg) + tilt;
}

/** How far the fine tilt control reaches away from the nearest right angle. */
export const TILT_LIMIT = 30;

/** Keep a tilt inside the range the UI exposes. */
export function clampTilt(tilt: number): number {
  return Math.max(-TILT_LIMIT, Math.min(TILT_LIMIT, tilt));
}

/**
 * Uniform scale required so that a `aspect`-shaped rectangle rotated by
 * `angleDeg` still fully covers its own axis-aligned cell.
 *
 * Derived from the containment condition for a rotated rectangle: the corners of
 * the axis-aligned cell, expressed in the rotated frame, must stay within
 * `w/2` and `h/2`, which gives
 *   k >= |cos| + (h / w) * |sin|   and   k >= |cos| + (w / h) * |sin|.
 * The result is 1 for every multiple of 180 degrees and grows with the tilt.
 */
export function rotationCoverScale(angleDeg: number, aspect: number): number {
  const withinHalfTurn = ((angleDeg % 180) + 180) % 180;
  const rad = (withinHalfTurn * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const ratio = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  return cos + Math.max(ratio, 1 / ratio) * sin;
}
