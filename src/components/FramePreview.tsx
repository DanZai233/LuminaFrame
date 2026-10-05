import React, { useRef, useState, useEffect } from 'react';
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
}

export const FramePreview: React.FC<FramePreviewProps> = ({
  imageSrc,
  cropState,
  frameConfig,
  metadata,
  showGrid,
  onUpdateOffset,
  onImageLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialOffsetX: number; initialOffsetY: number }>({
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });

  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    if (onImageLoaded) {
      onImageLoaded(img);
    }
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const sensitivity = 0.25;

      const newOffsetX = Math.max(-50, Math.min(50, dragStartRef.current.initialOffsetX - dx * sensitivity));
      const newOffsetY = Math.max(-50, Math.min(50, dragStartRef.current.initialOffsetY - dy * sensitivity));

      onUpdateOffset(newOffsetX, newOffsetY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragStartRef.current.startX;
      const dy = e.touches[0].clientY - dragStartRef.current.startY;
      const sensitivity = 0.25;

      const newOffsetX = Math.max(-50, Math.min(50, dragStartRef.current.initialOffsetX - dx * sensitivity));
      const newOffsetY = Math.max(-50, Math.min(50, dragStartRef.current.initialOffsetY - dy * sensitivity));

      onUpdateOffset(newOffsetX, newOffsetY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, onUpdateOffset]);

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

  return (
    <div className="relative w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#07080a] min-h-[380px] sm:min-h-[500px] rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden select-none">
      {/* Background Studio Light Falloff */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(38,38,38,0.25)_0%,transparent_70%)] pointer-events-none" />

      {/* Frame Container */}
      <div
        ref={containerRef}
        className="relative max-w-full transition-all duration-200 ease-out shadow-2xl"
        style={{
          backgroundColor: frameConfig.frameColor,
          padding:
            frameConfig.paddingSize === 'none'
              ? '0px'
              : frameConfig.paddingSize === 'compact'
              ? '16px'
              : frameConfig.paddingSize === 'generous'
              ? '40px'
              : '24px',
          paddingBottom:
            isPolaroid
              ? '72px'
              : isXPanStyle
              ? (frameConfig.watermark?.enabled ? '46px' : '36px')
              : (frameConfig.showMetadata || frameConfig.watermark?.enabled)
              ? frameConfig.paddingSize === 'generous'
                ? '64px'
                : '48px'
              : undefined,
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
            maxHeight: '68vh',
            maxWidth: '100%',
          }}
        >
          {/* Cropped Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Preview"
            onLoad={handleImageLoad}
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-75 pointer-events-none"
            style={{
              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%) rotate(${cropState.rotation}deg) scaleX(${
                cropState.flipH ? -1 : 1
              })`,
            }}
          />

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
  );
};
