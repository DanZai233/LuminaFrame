import React, { useRef, useState, useEffect } from 'react';
import { ImageOff, Move } from 'lucide-react';
import { CropState, FrameConfig, PhotoMetadata } from '../types';
import { BrandLogo } from '../utils/brandLogos';
import { ColorPaletteBar } from './ColorPaletteBar';
import { ASPECT_RATIOS } from '../utils/aspectRatios';
import { rotationCoverScale } from '../utils/rotation';

/**
 * `crop`   – the whole photo plus a draggable crop window (nothing is hidden).
 * `result` – the finished frame, i.e. what `canvasRenderer` will export.
 */
export type PreviewMode = 'crop' | 'result';

/** Zoom bounds, kept in step with the zoom slider in `src/App.tsx`. */
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

type ResizeHandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** Same order as the visual affordances: corners, then edge midpoints. */
const RESIZE_HANDLES: { id: ResizeHandleId; cursor: string }[] = [
  { id: 'nw', cursor: 'cursor-nwse-resize' },
  { id: 'n', cursor: 'cursor-ns-resize' },
  { id: 'ne', cursor: 'cursor-nesw-resize' },
  { id: 'e', cursor: 'cursor-ew-resize' },
  { id: 'se', cursor: 'cursor-nwse-resize' },
  { id: 's', cursor: 'cursor-ns-resize' },
  { id: 'sw', cursor: 'cursor-nesw-resize' },
  { id: 'w', cursor: 'cursor-ew-resize' },
];

const CORNER_IDS: ResizeHandleId[] = ['nw', 'ne', 'se', 'sw'];

/** Keeps the little grab dot just inside the window corner, so it is never clipped. */
const CORNER_DOT_STYLE: Record<string, React.CSSProperties> = {
  nw: { left: 4, top: 4 },
  ne: { right: 4, top: 4 },
  se: { right: 4, bottom: 4 },
  sw: { left: 4, bottom: 4 },
};

/**
 * Hit box for one resize grip, in the window's coordinate space. Everything is
 * anchored *inside* the window: the window always sits inside the photo, so the
 * grips stay fully hit-testable even when the window is flush with the photo
 * edge (which is the default for XPan at 1x).
 */
const handleHitStyle = (id: ResizeHandleId): React.CSSProperties => {
  const C = 22; // corner hit box side
  const T = 14; // edge strip thickness
  switch (id) {
    case 'nw':
      return { left: 0, top: 0, width: C, height: C };
    case 'n':
      return { left: C, right: C, top: 0, height: T };
    case 'ne':
      return { right: 0, top: 0, width: C, height: C };
    case 'e':
      return { right: 0, top: C, bottom: C, width: T };
    case 'se':
      return { right: 0, bottom: 0, width: C, height: C };
    case 's':
      return { left: C, right: C, bottom: 0, height: T };
    case 'sw':
      return { left: 0, bottom: 0, width: C, height: C };
    default:
      return { left: 0, top: C, bottom: C, width: T };
  }
};

interface FramePreviewProps {
  imageSrc: string;
  cropState: CropState;
  frameConfig: FrameConfig;
  metadata: PhotoMetadata;
  showGrid: boolean;
  onUpdateOffset: (offsetX: number, offsetY: number) => void;
  /** Resizing a grip changes the zoom and both offsets at once. */
  onUpdateCrop: (next: { zoom: number; offsetX: number; offsetY: number }) => void;
  onImageLoaded?: (img: HTMLImageElement) => void;
  filmFilterCss?: string;
  filmGrain?: number;
  mode?: PreviewMode;
}

export const FramePreview: React.FC<FramePreviewProps> = ({
  imageSrc,
  cropState,
  frameConfig,
  metadata,
  showGrid,
  onUpdateOffset,
  onUpdateCrop,
  onImageLoaded,
  filmFilterCss,
  filmGrain = 0,
  mode = 'crop',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandleId | null>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const dragStartRef = useRef<{ startX: number; startY: number; initialOffsetX: number; initialOffsetY: number }>({
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });

  /**
   * Everything the grip maths needs, frozen when the drag starts: the grips are
   * anchored to the window as it was, so the opposite edge stays put even while
   * the state updates underneath.
   */
  const resizeStartRef = useRef<{
    handle: ResizeHandleId;
    rect: { left: number; top: number; width: number; height: number };
    /** The stage's client origin, to convert pointer coordinates into `rect` space. */
    originX: number;
    originY: number;
    fitScale: number;
    photoX: number;
    photoY: number;
    photoW: number;
    photoH: number;
    maxWinW: number;
    minWinW: number;
    baseSrcW: number;
    imgW: number;
    imgH: number;
    ratio: number;
  } | null>(null);

  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

  // Load the photo through a detached `Image()` instead of the visible <img>:
  // the element only exists in cropping mode, so a tab switch mid-load would
  // otherwise leave the geometry (and the exported bitmap) stuck at 1×1.
  useEffect(() => {
    let cancelled = false;
    setImageStatus('loading');
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageStatus('ready');
      if (onImageLoaded) {
        onImageLoaded(img);
      }
    };
    img.onerror = () => {
      if (!cancelled) setImageStatus('error');
    };
    img.src = imageSrc;
    return () => {
      cancelled = true;
    };
  }, [imageSrc, onImageLoaded]);

  // Determine active aspect ratio
  const targetRatio = cropState.ratioValue > 0 ? cropState.ratioValue : imgNaturalSize.width / imgNaturalSize.height;

  // --- Crop geometry -------------------------------------------------------
  // Deliberately mirrors the source-rect maths in `src/utils/canvasRenderer.ts`
  // so the window drawn on screen is exactly the region that gets exported.
  const activeZoom = Math.max(1, cropState.zoom);
  const imgW = imgNaturalSize.width;
  const imgH = imgNaturalSize.height;
  const imgRatio = imgW / imgH;

  let srcW = imgW;
  let srcH = imgH;
  if (imgRatio > targetRatio) {
    srcW = imgH * targetRatio;
    srcH = imgH;
  } else {
    srcW = imgW;
    srcH = imgW / targetRatio;
  }
  srcW /= activeZoom;
  srcH /= activeZoom;

  const maxOffsetX = (imgW - srcW) / 2;
  const maxOffsetY = (imgH - srcH) / 2;
  const srcX = Math.max(0, Math.min(imgW - srcW, maxOffsetX * (1 + cropState.offsetX / 50)));
  const srcY = Math.max(0, Math.min(imgH - srcH, maxOffsetY * (1 + cropState.offsetY / 50)));

  // `object-contain` box of the photo inside the stage.
  const fitScale =
    stageSize.width > 0 && stageSize.height > 0 ? Math.min(stageSize.width / imgW, stageSize.height / imgH) : 0;
  const photoW = imgW * fitScale;
  const photoH = imgH * fitScale;
  const photoX = (stageSize.width - photoW) / 2;
  const photoY = (stageSize.height - photoH) / 2;

  const cropRect =
    fitScale > 0 && imageStatus === 'ready'
      ? {
          left: photoX + (srcX / imgW) * photoW,
          top: photoY + (srcY / imgH) * photoH,
          width: (srcW / imgW) * photoW,
          height: (srcH / imgH) * photoH,
        }
      : null;

  // On-screen travel of the window as the offset sweeps 0 -> ±50.
  const maxOffsetScreenX = (photoW * (1 - srcW / imgW)) / 2;
  const maxOffsetScreenY = (photoH * (1 - srcH / imgH)) / 2;

  // The window at zoom 1: the largest crop the current ratio allows. Every grip
  // resize is expressed against it, because `zoom = baseSrcW / srcW`.
  const baseSrcW = srcW * activeZoom;
  const maxWinW = baseSrcW * fitScale;
  const minWinW = maxWinW / MAX_ZOOM;

  // how much a non-right-angle rotation magnifies the photo to keep the cell full
  const rotationCover = rotationCoverScale(cropState.rotation, targetRatio);

  const isInteracting = isDragging || resizeHandle !== null;

  const ratioOption = ASPECT_RATIOS.find((r) => r.id === cropState.ratioId);
  const ratioLabel = ratioOption?.label ?? `${targetRatio.toFixed(2)}:1`;
  const showRotatedOutput = cropState.rotation !== 0 || cropState.flipH;

  // Photo box keeps the photo's own shape while it loads, then the frame's
  // shape, so the skeleton never collapses to a square.
  const stageAspect = imageStatus === 'ready' && imgW > 1 ? imgW / imgH : targetRatio;
  const outputAspect = targetRatio;

  /**
   * The exported pixels, rendered purely with CSS background maths so it works
   * at any size without measuring the box. Percentage `background-size` is
   * relative to the element, so `imgW / srcW` maps the source rect exactly onto
   * the slot; `background-position` is then scaled by the leftover room
   * (`imgW - srcW`), which is why the window offset is a plain ratio.
   */
  const croppedBackdropStyle: React.CSSProperties = {
    backgroundImage: `url("${imageSrc}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${(imgW / srcW) * 100}% ${(imgH / srcH) * 100}%`,
    backgroundPosition: `${imgW > srcW ? (srcX / (imgW - srcW)) * 100 : 0}% ${
      imgH > srcH ? (srcY / (imgH - srcH)) * 100 : 0
    }%`,
    // Mirrors `canvasRenderer`: turn the layer, then blow it up by the exact
    // factor that hides the empty corners a rotation would otherwise expose.
    transform: `rotate(${cropState.rotation}deg) scale(${rotationCoverScale(
      cropState.rotation,
      outputAspect
    )}) scaleX(${cropState.flipH ? -1 : 1})`,
    filter: filmFilterCss && filmFilterCss !== 'none' ? filmFilterCss : undefined,
  };

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: cropState.offsetX,
      initialOffsetY: cropState.offsetY,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialOffsetX: cropState.offsetX,
        initialOffsetY: cropState.offsetY,
      };
    }
  };

  /**
   * Freeze the geometry a grip drag starts from. `stopPropagation` matters: the
   * grips live inside the stage whose own handler would otherwise begin a move.
   */
  const beginResize = (e: React.MouseEvent | React.TouchEvent, handle: ResizeHandleId) => {
    if (!cropRect || fitScale <= 0) return;
    const stageRect = photoContainerRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    e.stopPropagation();
    resizeStartRef.current = {
      handle,
      rect: { ...cropRect },
      originX: stageRect.left,
      originY: stageRect.top,
      fitScale,
      photoX,
      photoY,
      photoW,
      photoH,
      maxWinW,
      minWinW,
      baseSrcW,
      imgW,
      imgH,
      ratio: targetRatio,
    };
    setResizeHandle(handle);
  };

  /**
   * Turn a pointer position into a new crop window: the edge or corner opposite
   * the grip stays anchored, the ratio stays locked, and the result is converted
   * back into the (zoom, offsetX, offsetY) triple the exporter consumes.
   */
  const cropFromResize = (clientX: number, clientY: number) => {
    const s = resizeStartRef.current;
    if (!s) return null;
    const { rect, originX, originY, photoX, photoY, photoW, photoH, fitScale, maxWinW, minWinW, baseSrcW, imgW, imgH, ratio } = s;
    // The frozen rect lives in the stage's own coordinate space, so move the
    // pointer into that space before measuring anything against it.
    const pointX = clientX - originX;
    const pointY = clientY - originY;
    const photoRight = photoX + photoW;
    const photoBottom = photoY + photoH;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const westGrip = s.handle.includes('w');
    const eastGrip = s.handle.includes('e');
    const northGrip = s.handle.includes('n');
    const southGrip = s.handle.includes('s');

    const anchorX = westGrip ? rect.left + rect.width : rect.left;
    const anchorY = northGrip ? rect.top + rect.height : rect.top;

    const rawW = Math.abs(pointX - anchorX);
    const rawH = Math.abs(pointY - anchorY);
    const wantedW =
      westGrip || eastGrip ? (northGrip || southGrip ? Math.max(rawW, rawH * ratio) : rawW) : rawH * ratio;

    // How much room the anchored edge leaves inside the photo.
    let roomW: number;
    if (westGrip) roomW = anchorX - photoX;
    else if (eastGrip) roomW = photoRight - anchorX;
    else roomW = 2 * Math.min(cx - photoX, photoRight - cx);

    let roomH: number;
    if (northGrip) roomH = anchorY - photoY;
    else if (southGrip) roomH = photoBottom - anchorY;
    else roomH = 2 * Math.min(cy - photoY, photoBottom - cy);

    const winW = Math.max(minWinW, Math.min(wantedW, maxWinW, roomW, roomH * ratio));

    // The window is the visible half of the pair; zoom is the source half.
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseSrcW / (winW / fitScale)));
    const finalWinW = (baseSrcW / zoom) * fitScale;
    const finalWinH = finalWinW / ratio;

    let left: number;
    if (westGrip) left = anchorX - finalWinW;
    else if (eastGrip) left = anchorX;
    else left = cx - finalWinW / 2;

    let top: number;
    if (northGrip) top = anchorY - finalWinH;
    else if (southGrip) top = anchorY;
    else top = cy - finalWinH / 2;

    left = Math.max(photoX, Math.min(photoRight - finalWinW, left));
    top = Math.max(photoY, Math.min(photoBottom - finalWinH, top));

    const newSrcW = finalWinW / fitScale;
    const newSrcH = finalWinH / fitScale;
    const srcLeft = (left - photoX) / fitScale;
    const srcTop = (top - photoY) / fitScale;
    const roomOffsetX = (imgW - newSrcW) / 2;
    const roomOffsetY = (imgH - newSrcH) / 2;

    const offsetX = roomOffsetX > 0.5 ? Math.max(-50, Math.min(50, 50 * (srcLeft / roomOffsetX - 1))) : 0;
    const offsetY = roomOffsetY > 0.5 ? Math.max(-50, Math.min(50, 50 * (srcTop / roomOffsetY - 1))) : 0;

    return { zoom, offsetX, offsetY };
  };

  // Track the rendered size of the photo stage so the crop window can be
  // positioned in real pixels instead of guessed percentages.
  useEffect(() => {
    const el = photoContainerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setStageSize((prev) =>
        Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
          ? prev
          : { width: rect.width, height: rect.height }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    if (!isDragging) return;

    // Dragging moves the crop window itself, so the window tracks the cursor.
    // `maxOffsetScreen*` is how far the window can travel on screen, which maps
    // linearly onto the ±50 offset range the exporter expects.
    const offsetFromDelta = (clientX: number, clientY: number) => {
      const dx = clientX - dragStartRef.current.startX;
      const dy = clientY - dragStartRef.current.startY;
      const nextX =
        maxOffsetScreenX > 1
          ? dragStartRef.current.initialOffsetX + (dx / maxOffsetScreenX) * 50
          : dragStartRef.current.initialOffsetX;
      const nextY =
        maxOffsetScreenY > 1
          ? dragStartRef.current.initialOffsetY + (dy / maxOffsetScreenY) * 50
          : dragStartRef.current.initialOffsetY;
      return {
        x: Math.max(-50, Math.min(50, nextX)),
        y: Math.max(-50, Math.min(50, nextY)),
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const next = offsetFromDelta(e.clientX, e.clientY);
      onUpdateOffset(next.x, next.y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const next = offsetFromDelta(e.touches[0].clientX, e.touches[0].clientY);
      onUpdateOffset(next.x, next.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, onUpdateOffset, maxOffsetScreenX, maxOffsetScreenY]);

  useEffect(() => {
    if (!resizeHandle) return;

    const apply = (clientX: number, clientY: number) => {
      const next = cropFromResize(clientX, clientY);
      if (next) onUpdateCrop(next);
    };

    const handleMouseMove = (e: MouseEvent) => apply(e.clientX, e.clientY);

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      apply(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleUp = () => setResizeHandle(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [resizeHandle, onUpdateCrop]);

  const isLight =
    frameConfig.frameColor === '#ffffff' ||
    frameConfig.frameColor === '#f7f7f5' ||
    frameConfig.frameColor === '#f4efe6' ||
    frameConfig.frameColor === '#fdfbf7' ||
    frameConfig.frameColor === '#f8f8f6';

  const isXPanStyle = frameConfig.styleId === 'xpan-film';
  const isPolaroid = frameConfig.styleId === 'polaroid-vintage';

  // Calculate individual padding values to avoid shorthand/non-shorthand conflict.
  // Values are exposed as CSS custom properties so the frame keeps its
  // proportions when the preview gets narrow (see `--frame-pad-scale`, set from
  // a media query in index.css); the export renderer uses its own absolute
  // geometry and is unaffected.
  const padTopValue =
    frameConfig.paddingSize === 'none'
      ? 0
      : frameConfig.paddingSize === 'compact'
      ? 16
      : frameConfig.paddingSize === 'generous'
      ? 40
      : 24;

  const padBottomValue =
    frameConfig.paddingSize === 'none' && !frameConfig.showMetadata && !frameConfig.watermark?.enabled
      ? 0
      : isPolaroid
      ? 72
      : isXPanStyle
      ? frameConfig.watermark?.enabled
        ? 46
        : 36
      : frameConfig.showMetadata || frameConfig.watermark?.enabled
      ? frameConfig.paddingSize === 'generous'
        ? 64
        : 48
      : padTopValue;

  const s = 'var(--frame-pad-scale, 1)';
  const padTop = `calc(${padTopValue}px * ${s})`;
  const padSide = padTop;
  const padBottom = `calc(${padBottomValue}px * ${s})`;

  return (
    <div className="flex w-full min-w-0 items-center justify-center overflow-hidden py-1 select-none">
      {/* Frame Container */}
      <div
        className="relative flex w-full min-w-0 max-w-full flex-col items-center"
        style={{ width: 'min(100%, var(--frame-max-w, 100%))' }}
      >
      <div
        ref={containerRef}
        className="relative w-full min-w-0 max-w-full transition-[padding,border-radius] duration-200 ease-out shadow-2xl shadow-black/60"
        style={{
          backgroundColor: mode === 'result' ? frameConfig.frameColor : '#09090b',
          paddingTop: mode === 'result' ? padTop : 0,
          paddingRight: mode === 'result' ? padSide : 0,
          paddingBottom: mode === 'result' ? padBottom : 0,
          paddingLeft: mode === 'result' ? padSide : 0,
          borderRadius: `${mode === 'result' ? frameConfig.borderRadius : 14}px`,
        }}
      >
        {/* Top XPan Film Sprockets Row */}
        {mode === 'result' && isXPanStyle && (
          <div className="mb-2 w-full flex items-center justify-between overflow-hidden px-1">
            {/* Sprockets simulation */}
            <div className="flex w-full items-center justify-between gap-1.5 overflow-hidden opacity-90">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={`top-hole-${i}`}
                  className="h-4 w-3 max-w-3 min-w-0 flex-1 rounded-[2px] border border-zinc-900 bg-zinc-950"
                />
              ))}
            </div>
          </div>
        )}

        {/* XPan Top Film Stamp */}
        {mode === 'result' && isXPanStyle && (
          <div
            data-xpan-stamp
            className="flex items-center justify-between text-[10px] text-amber-500/90 font-mono tracking-widest px-2 mb-1.5 font-semibold"
          >
            <span>HASSELBLAD XPAN · 24×65mm PANORAMA</span>
            <span>EXP 24A · 400</span>
          </div>
        )}

        {mode === 'result' ? (
          /*
            Finished frame. The photo slot has the *exported* shape and shows the
            cropped source rect via `croppedBackdropStyle`, so padding, film
            perforations, metadata and watermark sit exactly where the canvas
            renderer will put them.
          */
          <div className="relative mx-auto w-full min-w-0">
            <div
              data-photo-stage
              className={`relative w-full overflow-hidden bg-zinc-950 ${
                frameConfig.showInnerBorder && !isXPanStyle
                  ? isLight
                    ? 'ring-1 ring-inset ring-black/15'
                    : 'ring-1 ring-inset ring-white/20'
                  : ''
              }`}
              style={{
                aspectRatio: `${outputAspect}`,
                maxHeight: 'var(--preview-max-h, 60vh)',
                maxWidth: `calc(var(--preview-max-h, 60vh) * ${outputAspect})`,
              }}
            >
              <div className="absolute inset-0" style={croppedBackdropStyle} />

              {/* Film Grain Texture Overlay */}
              {filmGrain !== undefined && filmGrain > 0 && (
                <div
                  className="pointer-events-none absolute inset-0 z-5 mix-blend-overlay"
                  style={{
                    opacity: (filmGrain / 100) * 0.42,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />
              )}

              {/* Rule of thirds inside the photo slot */}
              {showGrid && (
                <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
                  <div className="border-b border-r border-white/25" />
                  <div className="border-b border-r border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-b border-r border-white/25" />
                  <div className="border-b border-r border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-white/25" />
                  <div className="border-r border-white/25" />
                  <div />
                </div>
              )}

              {/* Loading Skeleton */}
              {imageStatus === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
                  <span className="font-mono text-[11px] text-zinc-500">正在载入照片…</span>
                </div>
              )}

              {imageStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900 px-6 text-center">
                  <ImageOff className="h-6 w-6 text-rose-400" />
                  <span className="text-xs font-medium text-zinc-300">照片载入失败</span>
                  <span className="max-w-xs text-[11px] leading-relaxed text-zinc-500">
                    请确认图片链接可访问，或点击顶部「上传照片」改用本地文件。
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /*
            Cropping mode: the photo is never clipped. The full frame is visible
            so you can always tell where the crop window sits inside it, and
            everything outside the window is dimmed by the scrim panes below
            instead of being hidden.
          */
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="stage relative w-full min-w-0 touch-none cursor-grab select-none active:cursor-grabbing"
        >
          <div
            ref={photoContainerRef}
            data-photo-stage
            className="relative mx-auto w-full bg-zinc-950"
            style={{
              aspectRatio: `${stageAspect}`,
              maxHeight: 'var(--preview-max-h, 66vh)',
              maxWidth: `calc(var(--preview-max-h, 66vh) * ${stageAspect})`,
            }}
          >
            {/* The photo itself. When tilted, the whole picture turns around the
                crop window's centre, scaled by the same factor the window's
                inner layer uses, so the two meet seamlessly at the window edge
                instead of showing a kink there. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <img
                src={imageSrc}
                alt={metadata.model ? `${metadata.make} ${metadata.model} preview` : 'Preview'}
                draggable={false}
                className={`absolute inset-0 h-full w-full max-w-none object-contain transition-opacity duration-150 ${
                  imageStatus === 'ready' ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  filter: filmFilterCss && filmFilterCss !== 'none' ? filmFilterCss : undefined,
                  transform:
                    cropRect && rotationCover > 1.001
                      ? `rotate(${cropState.rotation}deg) scale(${rotationCover})`
                      : undefined,
                  transformOrigin: cropRect
                    ? `${cropRect.left + cropRect.width / 2}px ${
                        cropRect.top + cropRect.height / 2
                      }px`
                    : 'center',
                }}
              />
            </div>

            {/* Film Grain Texture Overlay */}
            {filmGrain !== undefined && filmGrain > 0 && (
              <div
                className="pointer-events-none absolute inset-0 z-5 mix-blend-overlay"
                style={{
                  opacity: (filmGrain / 100) * 0.42,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
            )}

            {/* Dimming scrim: the four panes around the crop window */}
            {imageStatus === 'ready' && cropRect && (
              <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
                {[
                  { left: 0, top: 0, width: '100%', height: `${cropRect.top}px` },
                  {
                    left: 0,
                    top: `${cropRect.top}px`,
                    width: `${cropRect.left}px`,
                    height: `${cropRect.height}px`,
                  },
                  {
                    left: `${cropRect.left + cropRect.width}px`,
                    top: `${cropRect.top}px`,
                    width: `${Math.max(0, stageSize.width - cropRect.left - cropRect.width)}px`,
                    height: `${cropRect.height}px`,
                  },
                  {
                    left: 0,
                    top: `${cropRect.top + cropRect.height}px`,
                    width: '100%',
                    height: `${Math.max(0, stageSize.height - cropRect.top - cropRect.height)}px`,
                  },
                ].map((pane, i) => (
                  <div key={`scrim-${i}`} className="absolute bg-black/50" style={pane} />
                ))}
              </div>
            )}

            {/* The crop window itself */}
            {imageStatus === 'ready' && cropRect && (
              <div
                data-crop-window
                className="pointer-events-none absolute z-10 overflow-hidden border-solid"
                style={{
                  left: `${cropRect.left}px`,
                  top: `${cropRect.top}px`,
                  width: `${cropRect.width}px`,
                  height: `${cropRect.height}px`,
                  borderColor: isInteracting ? 'rgb(252 211 77)' : 'rgba(244,244,245,0.9)',
                  borderWidth: isInteracting ? '2px' : '1.5px',
                  boxShadow: isInteracting
                    ? '0 0 0 1px rgba(0,0,0,0.5), 0 0 26px rgba(252,211,77,0.35)'
                    : '0 0 0 1px rgba(0,0,0,0.45)',
                }}
              >
                {/*
                  Rotation / mirror are applied to the exported pixels, not to the
                  photo on screen, so when either is active the window renders the
                  transformed result on top of the untouched photo. The background
                  maths is the CSS equivalent of the exporter's `drawImage` call.
                */}
                {showRotatedOutput && cropRect.width > 2 && (
                  <div className="absolute inset-0" style={croppedBackdropStyle} />
                )}

                {/* Corner brackets */}
                <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-amber-400" />
                <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-amber-400" />
                <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-amber-400" />
                <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-amber-400" />

                {/* Inner border preview (matches the exporter's optional inner ring) */}
                {frameConfig.showInnerBorder && !isXPanStyle && (
                  <span
                    className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${
                      isLight ? 'ring-black/15' : 'ring-white/20'
                    }`}
                  />
                )}

                {/* Rule of thirds inside the window */}
                {(showGrid || isInteracting) && (
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                    <div className="border-b border-r border-white/30" />
                    <div className="border-b border-r border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-b border-r border-white/30" />
                    <div className="border-b border-r border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div />
                  </div>
                )}

                <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded-sm bg-amber-400 px-1.5 py-px font-mono text-[9px] font-bold whitespace-nowrap text-zinc-950">
                  {ratioLabel}
                </span>

                {isDragging && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-amber-200">
                    拖动中 · X {Math.round(cropState.offsetX)}% · Y {Math.round(cropState.offsetY)}%
                  </span>
                )}

                {resizeHandle && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-amber-200">
                    缩放中 · {activeZoom.toFixed(2)}x
                  </span>
                )}
              </div>
            )}

            {/*
              Resize grips. They sit outside the window element (which clips its
              contents) so a grip on a photo-flush edge stays fully clickable.
            */}
            {imageStatus === 'ready' && cropRect && (
              <div
                className="absolute z-20"
                style={{
                  left: `${cropRect.left}px`,
                  top: `${cropRect.top}px`,
                  width: `${cropRect.width}px`,
                  height: `${cropRect.height}px`,
                }}
              >
                {RESIZE_HANDLES.map((h) => (
                  <div
                    key={h.id}
                    data-resize-handle={h.id}
                    onMouseDown={(e) => beginResize(e, h.id)}
                    onTouchStart={(e) => beginResize(e, h.id)}
                    className={`absolute touch-none ${h.cursor}`}
                    style={handleHitStyle(h.id)}
                  >
                    {CORNER_IDS.includes(h.id) && (
                      <span
                        className={`pointer-events-none absolute h-2 w-2 rounded-[2px] border border-zinc-950/80 transition-transform duration-150 ${
                          resizeHandle === h.id ? 'scale-150 bg-amber-300' : 'bg-amber-400'
                        }`}
                        style={CORNER_DOT_STYLE[h.id]}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Loading Skeleton */}
            {imageStatus === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
                <span className="font-mono text-[11px] text-zinc-500">正在载入照片…</span>
              </div>
            )}

            {/* Image Load Failure */}
            {imageStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900 px-6 text-center">
                <ImageOff className="h-6 w-6 text-rose-400" />
                <span className="text-xs font-medium text-zinc-300">照片载入失败</span>
                <span className="max-w-xs text-[11px] leading-relaxed text-zinc-500">
                  请确认图片链接可访问，或点击顶部「上传照片」改用本地文件。
                </span>
              </div>
            )}
          </div>

          {/* Hint under the stage */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 font-mono text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Move className="h-3 w-3 shrink-0 text-amber-400/80" />
              <span>
                拖动移动取景框 · 拖四角或边框缩放
                <span className="hidden sm:inline"> · 框外保留原图便于定位，只有框内区域会被导出</span>
              </span>
            </span>
            <span className="hidden sm:inline">
              取景 {Math.round(srcW)} × {Math.round(srcH)} px · {activeZoom.toFixed(2)}x
              {rotationCover > 1.001 && (
                <span className="text-amber-400/90"> · 倾斜补正 {rotationCover.toFixed(2)}x</span>
              )}
            </span>
          </div>
        </div>
        )}

        {/* Bottom XPan Film Sprockets Row */}
        {mode === 'result' && isXPanStyle && (
          <div className="mt-2.5 w-full flex items-center justify-between overflow-hidden px-1">
            <div className="flex w-full items-center justify-between gap-1.5 overflow-hidden opacity-90">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={`bot-hole-${i}`}
                  className="h-4 w-3 max-w-3 min-w-0 flex-1 rounded-[2px] border border-zinc-900 bg-zinc-950"
                />
              ))}
            </div>
          </div>
        )}

        {/* Frame Bottom Metadata Section */}
        {mode === 'result' && frameConfig.showMetadata && (
          <div
            data-frame-copy
            className={`w-full mt-3 px-1 transition-colors ${
              isXPanStyle
                ? 'text-zinc-200'
                : isLight
                ? 'text-zinc-900'
                : 'text-zinc-100'
            }`}
          >
            {/* Style 1: XPAN Film Bottom Row */}
            {isXPanStyle ? (
              <div className="flex items-end justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-zinc-100 tracking-wide">
                    <span>{metadata.make} {metadata.model}</span>
                    {metadata.lens && (
                      <span className="text-[11px] font-normal text-zinc-400">· {metadata.lens}</span>
                    )}
                  </div>
                  {(metadata.location || metadata.dateTime) && (
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {[metadata.location, metadata.dateTime].filter(Boolean).join('  ·  ')}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs text-amber-400 font-semibold tracking-wider">
                    {metadata.aperture}  {metadata.shutterSpeed}  ISO {metadata.iso}
                  </div>
                  {metadata.filmSimulation && (
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {metadata.filmSimulation}
                    </div>
                  )}
                </div>
              </div>
            ) : frameConfig.styleId === 'leica-card' ? (
              /* Style 2: Leica Red Dot Signature */
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <BrandLogo brandId="leica" className="h-4" />
                  <span className="text-xs font-bold tracking-tight">{metadata.model}</span>
                  {metadata.lens && (
                    <span className="text-[11px] text-zinc-500 font-normal">· {metadata.lens}</span>
                  )}
                </div>

                {frameConfig.showColorPalette && (
                  <ColorPaletteBar colors={frameConfig.paletteColors} isLightBg={isLight} className="hidden sm:flex" />
                )}

                <div className="font-mono text-xs text-zinc-600 font-medium">
                  {metadata.aperture}   {metadata.shutterSpeed}   ISO {metadata.iso}
                </div>
              </div>
            ) : isPolaroid ? (
              /* Style 3: Polaroid Vintage */
              <div className="text-center pt-3 space-y-1">
                <div className="font-bold text-sm tracking-wide text-zinc-800">
                  {metadata.photographer || metadata.model || 'MEMORIES'}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {[metadata.dateTime, metadata.location, `${metadata.aperture} ${metadata.shutterSpeed}`].filter(Boolean).join('  ·  ')}
                </div>
              </div>
            ) : (
              /* Style 4: Classic Gallery Matte / Darkroom Matte */
              <div className="flex items-center justify-between gap-4 pt-1">
                {/* Left: Brand & Model */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {frameConfig.showCameraLogo && (
                      <BrandLogo
                        brandId={frameConfig.brandLogo || metadata.make}
                        className="h-3.5"
                        color={isLight ? '#111827' : '#f9fafb'}
                      />
                    )}
                    <span className="text-xs font-bold tracking-tight">
                      {metadata.make} {metadata.model}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal">
                    {[metadata.lens || metadata.focalLength, metadata.photographer ? `Photo by ${metadata.photographer}` : ''].filter(Boolean).join('  ·  ')}
                  </div>
                </div>

                {/* Center: Extracted Colors */}
                {frameConfig.showColorPalette && (
                  <ColorPaletteBar colors={frameConfig.paletteColors} isLightBg={isLight} className="hidden sm:flex" />
                )}

                {/* Right: Exposure Triangle */}
                <div className="text-right space-y-0.5">
                  <div className="font-mono text-xs font-semibold tabular-nums">
                    {metadata.aperture}   {metadata.shutterSpeed}   ISO {metadata.iso}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {[metadata.exposureBias && metadata.exposureBias !== '0 EV' ? metadata.exposureBias : null, metadata.dateTime].filter(Boolean).join('  ·  ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customizable Photographer Watermark Signature */}
        {mode === 'result' && frameConfig.watermark?.enabled && frameConfig.watermark?.text && (
          <div
            data-frame-copy
            className={`w-full ${frameConfig.showMetadata ? 'mt-2' : 'mt-3'} px-1 flex ${
              frameConfig.watermark.position === 'left'
                ? 'justify-start text-left'
                : frameConfig.watermark.position === 'center'
                ? 'justify-center text-center'
                : 'justify-end text-right'
            }`}
          >
            <span
              className={`transition-all select-none inline-block ${
                frameConfig.watermark.font === 'script'
                  ? 'font-script-signature'
                  : frameConfig.watermark.font === 'serif'
                  ? 'font-serif-display'
                  : frameConfig.watermark.font === 'mono'
                  ? 'font-mono-data'
                  : 'font-sans'
              } ${
                frameConfig.watermark.size === 'sm'
                  ? frameConfig.watermark.font === 'script'
                    ? 'text-xs'
                    : 'text-[10px]'
                  : frameConfig.watermark.size === 'lg'
                  ? frameConfig.watermark.font === 'script'
                    ? 'text-lg font-bold'
                    : 'text-sm font-semibold'
                  : frameConfig.watermark.font === 'script'
                  ? 'text-sm'
                  : 'text-xs'
              } ${
                frameConfig.watermark.letterSpacing === 'widest'
                  ? 'tracking-widest'
                  : frameConfig.watermark.letterSpacing === 'wide'
                  ? 'tracking-wide'
                  : frameConfig.watermark.letterSpacing === 'tight'
                  ? 'tracking-tighter'
                  : 'tracking-normal'
              }`}
              style={{
                opacity: frameConfig.watermark.opacity,
                color: isLight ? '#111827' : '#f3f4f6',
              }}
            >
              {frameConfig.watermark.text}
            </span>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
