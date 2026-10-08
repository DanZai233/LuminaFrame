import React, { useRef, useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { CropState, FrameConfig, PhotoMetadata } from '../types';
import { BrandLogo } from '../utils/brandLogos';
import { ColorPaletteBar } from './ColorPaletteBar';

interface FramePreviewProps {
  imageSrc: string;
  cropState: CropState;
  frameConfig: FrameConfig;
  metadata: PhotoMetadata;
  showGrid: boolean;
  onUpdateOffset: (offsetX: number, offsetY: number) => void;
  onImageLoaded?: (img: HTMLImageElement) => void;
  filmFilterCss?: string;
  filmGrain?: number;
}

export const FramePreview: React.FC<FramePreviewProps> = ({
  imageSrc,
  cropState,
  frameConfig,
  metadata,
  showGrid,
  onUpdateOffset,
  onImageLoaded,
  filmFilterCss,
  filmGrain = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const dragStartRef = useRef<{ startX: number; startY: number; initialOffsetX: number; initialOffsetY: number }>({
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });

  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

  // Reset the loading state whenever the underlying photo changes so the
  // skeleton is shown again instead of a stale frame.
  useEffect(() => {
    setImageStatus('loading');
  }, [imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageStatus('ready');
    if (onImageLoaded) {
      onImageLoaded(img);
    }
  };

  const handleImageError = () => {
    setImageStatus('error');
  };

  // Determine active aspect ratio
  const targetRatio = cropState.ratioValue > 0 ? cropState.ratioValue : imgNaturalSize.width / imgNaturalSize.height;

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

  useEffect(() => {
    // Translate viewport pixels into offset percent relative to the crop
    // window, so a drag feels the same on a phone and on a 4K monitor.
    const offsetFromDelta = (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || 800;
      const height = rect?.height || 600;
      const dx = clientX - dragStartRef.current.startX;
      const dy = clientY - dragStartRef.current.startY;
      const nextX = dragStartRef.current.initialOffsetX - (dx / width) * 100 * cropState.zoom;
      const nextY = dragStartRef.current.initialOffsetY - (dy / height) * 100 * cropState.zoom;
      return {
        x: Math.max(-50, Math.min(50, nextX)),
        y: Math.max(-50, Math.min(50, nextY)),
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const next = offsetFromDelta(e.clientX, e.clientY);
      onUpdateOffset(next.x, next.y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const next = offsetFromDelta(e.touches[0].clientX, e.touches[0].clientY);
      onUpdateOffset(next.x, next.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, onUpdateOffset, cropState.zoom]);

  const isLight =
    frameConfig.frameColor === '#ffffff' ||
    frameConfig.frameColor === '#f7f7f5' ||
    frameConfig.frameColor === '#f4efe6' ||
    frameConfig.frameColor === '#fdfbf7' ||
    frameConfig.frameColor === '#f8f8f6';

  const isXPanStyle = frameConfig.styleId === 'xpan-film';
  const isPolaroid = frameConfig.styleId === 'polaroid-vintage';

  // Calculate object position and scale
  // With zoom and offset:
  const scale = cropState.zoom;
  const translateX = -cropState.offsetX * 1.5;
  const translateY = -cropState.offsetY * 1.5;

  // Calculate individual padding values to avoid shorthand/non-shorthand conflict
  const padTop =
    frameConfig.paddingSize === 'none'
      ? '0px'
      : frameConfig.paddingSize === 'compact'
      ? '16px'
      : frameConfig.paddingSize === 'generous'
      ? '40px'
      : '24px';

  const padSide = padTop;

  const padBottom =
    frameConfig.paddingSize === 'none' && !frameConfig.showMetadata && !frameConfig.watermark?.enabled
      ? '0px'
      : isPolaroid
      ? '72px'
      : isXPanStyle
      ? frameConfig.watermark?.enabled
        ? '46px'
        : '36px'
      : frameConfig.showMetadata || frameConfig.watermark?.enabled
      ? frameConfig.paddingSize === 'generous'
        ? '64px'
        : '48px'
      : padTop;

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
          backgroundColor: frameConfig.frameColor,
          paddingTop: padTop,
          paddingRight: padSide,
          paddingBottom: padBottom,
          paddingLeft: padSide,
          borderRadius: `${frameConfig.borderRadius}px`,
        }}
      >
        {/* Top XPan Film Sprockets Row */}
        {isXPanStyle && (
          <div className="mb-2 w-full flex items-center justify-between overflow-hidden px-1">
            {/* Sprockets simulation */}
            <div className="flex items-center gap-3 opacity-90 overflow-hidden w-full justify-between">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={`top-hole-${i}`}
                  className="w-3 h-4 bg-zinc-950 rounded-[2px] border border-zinc-900 shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* XPan Top Film Stamp */}
        {isXPanStyle && (
          <div className="flex items-center justify-between text-[10px] text-amber-500/90 font-mono tracking-widest px-2 mb-1.5 font-semibold">
            <span>HASSELBLAD XPAN · 24×65mm PANORAMA</span>
            <span>EXP 24A · 400</span>
          </div>
        )}

        {/* Image Cropping Window */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`relative overflow-hidden cursor-grab active:cursor-grabbing ${
            frameConfig.showDropShadow && frameConfig.paddingSize !== 'none' && !isXPanStyle
              ? 'shadow-md shadow-black/25'
              : ''
          } ${
            frameConfig.showInnerBorder && !isXPanStyle
              ? isLight
                ? 'ring-1 ring-black/10'
                : 'ring-1 ring-white/15'
              : ''
          }`}
          style={{
            aspectRatio: `${targetRatio}`,
            maxHeight: 'var(--preview-max-h, 60vh)',
            maxWidth: '100%',
          }}
        >
          {/* Cropped Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt={metadata.model ? `${metadata.make} ${metadata.model} preview` : 'Preview'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
            className={`absolute inset-0 h-full w-full max-w-none object-cover transition-transform duration-75 pointer-events-none ${
              imageStatus === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%) rotate(${cropState.rotation}deg) scaleX(${
                cropState.flipH ? -1 : 1
              })`,
              filter: filmFilterCss && filmFilterCss !== 'none' ? filmFilterCss : undefined,
            }}
          />

          {/* Loading Skeleton */}
          {imageStatus === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900">
              <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-amber-400 animate-spin" />
              <span className="text-[11px] text-zinc-500 font-mono">正在载入照片…</span>
            </div>
          )}

          {/* Image Load Failure */}
          {imageStatus === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900 px-6 text-center">
              <ImageOff className="w-6 h-6 text-rose-400" />
              <span className="text-xs text-zinc-300 font-medium">照片载入失败</span>
              <span className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                请确认图片链接可访问，或点击顶部「上传照片」改用本地文件。
              </span>
            </div>
          )}
          {/* Film Grain Texture Overlay */}
          {filmGrain !== undefined && filmGrain > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay z-5"
              style={{
                opacity: (filmGrain / 100) * 0.42,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
          )}

          {/* Rule of Thirds Grid Overlay (Shows on drag or toggle) */}
          {(showGrid || isDragging) && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 transition-opacity duration-150">
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-white/30" />
              <div className="border-r border-white/30" />
              <div />
              {isDragging && (
                <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  拖拽中 · X: {Math.round(cropState.offsetX)}% Y: {Math.round(cropState.offsetY)}%
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom XPan Film Sprockets Row */}
        {isXPanStyle && (
          <div className="mt-2.5 w-full flex items-center justify-between overflow-hidden px-1">
            <div className="flex items-center gap-3 opacity-90 overflow-hidden w-full justify-between">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={`bot-hole-${i}`}
                  className="w-3 h-4 bg-zinc-950 rounded-[2px] border border-zinc-900 shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Frame Bottom Metadata Section */}
        {frameConfig.showMetadata && (
          <div
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
        {frameConfig.watermark?.enabled && frameConfig.watermark?.text && (
          <div
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
