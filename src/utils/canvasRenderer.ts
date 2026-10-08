import { CropState, FrameConfig, PhotoMetadata, FilmFilterConfig } from '../types';
import { computeFilmFilterCss } from './filmPresets';

export interface ColorEnhanceConfig {
  enabled: boolean;
  contrast?: number; // e.g. 1.14
  saturate?: number; // e.g. 1.20
  brightness?: number; // e.g. 1.02
  filterString?: string;
}

interface RenderOptions {
  image: HTMLImageElement;
  cropState: CropState;
  frameConfig: FrameConfig;
  metadata: PhotoMetadata;
  scale?: number; // 1, 2, 3
  colorEnhance?: ColorEnhanceConfig;
  filmConfig?: FilmFilterConfig;
}

export async function renderFramedPhotoToCanvas({
  image,
  cropState,
  frameConfig,
  metadata,
  scale = 2,
  colorEnhance,
  filmConfig,
}: RenderOptions): Promise<HTMLCanvasElement> {
  // Wait for web fonts if needed
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch {
    // continue
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Determine base photo dimension in final render
  // Let base width be 1800px scaled by export multiplier
  const basePhotoWidth = Math.min(2400, Math.max(1200, image.naturalWidth)) * (scale / 2);
  const targetRatio = cropState.ratioValue > 0 ? cropState.ratioValue : image.naturalWidth / image.naturalHeight;
  const basePhotoHeight = basePhotoWidth / targetRatio;

  // Frame padding calculations
  let padLeft = 0;
  let padRight = 0;
  let padTop = 0;
  let padBottom = 0;
  let extraBottomMeta = 0;

  const style = frameConfig.styleId;

  if (frameConfig.paddingSize !== 'none') {
    const padFactor =
      frameConfig.paddingSize === 'compact' ? 0.035 : frameConfig.paddingSize === 'generous' ? 0.09 : 0.06;
    const basePadding = basePhotoWidth * padFactor;
    padLeft = basePadding;
    padRight = basePadding;
    padTop = basePadding;
    padBottom = basePadding;

    if (style === 'xpan-film') {
      // Film strip layout has balanced top/bottom perforation borders
      const filmSprocketHeight = Math.max(48 * scale, basePhotoHeight * 0.16);
      padTop = filmSprocketHeight;
      const extraBottom = (frameConfig.showMetadata ? 45 * scale : 0) + (frameConfig.watermark?.enabled ? 20 * scale : 0);
      padBottom = filmSprocketHeight + extraBottom;
      padLeft = 32 * scale;
      padRight = 32 * scale;
    } else if (style === 'polaroid-vintage') {
      padTop = basePadding * 0.8;
      padLeft = basePadding * 0.8;
      padRight = basePadding * 0.8;
      padBottom = basePadding * 3.2; // Classic chunky bottom
    } else if (frameConfig.showMetadata || frameConfig.watermark?.enabled) {
      // Add extra bottom room for metadata and watermark signature
      extraBottomMeta = Math.max(64 * scale, basePhotoWidth * 0.065);
      if (frameConfig.watermark?.enabled && frameConfig.showMetadata) {
        extraBottomMeta += 24 * scale;
      }
      padBottom += extraBottomMeta;
    }
  } else if (frameConfig.showMetadata || frameConfig.watermark?.enabled) {
    extraBottomMeta = Math.max(54 * scale, basePhotoWidth * 0.05);
    if (frameConfig.watermark?.enabled && frameConfig.showMetadata) {
      extraBottomMeta += 24 * scale;
    }
    padBottom = extraBottomMeta;
  }

  const canvasWidth = Math.round(basePhotoWidth + padLeft + padRight);
  const canvasHeight = Math.round(basePhotoHeight + padTop + padBottom);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Fill Background
  ctx.fillStyle = frameConfig.frameColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Compute source crop rectangle from original image
  const imgW = image.naturalWidth;
  const imgH = image.naturalHeight;
  const imgRatio = imgW / imgH;

  let sWidth = imgW;
  let sHeight = imgH;

  if (imgRatio > targetRatio) {
    // Image is wider than target ratio
    sWidth = imgH * targetRatio;
    sHeight = imgH;
  } else {
    // Image is taller than target ratio
    sWidth = imgW;
    sHeight = imgW / targetRatio;
  }

  // Apply user zoom
  sWidth /= Math.max(1, cropState.zoom);
  sHeight /= Math.max(1, cropState.zoom);

  // Apply user offsets
  const maxOffsetX = (imgW - sWidth) / 2;
  const maxOffsetY = (imgH - sHeight) / 2;

  let sX = (imgW - sWidth) / 2 + (cropState.offsetX / 50) * maxOffsetX;
  let sY = (imgH - sHeight) / 2 + (cropState.offsetY / 50) * maxOffsetY;

  sX = Math.max(0, Math.min(imgW - sWidth, sX));
  sY = Math.max(0, Math.min(imgH - sHeight, sY));

  // Destination rectangle
  const dX = padLeft;
  const dY = padTop;
  const dWidth = basePhotoWidth;
  const dHeight = basePhotoHeight;

  // Draw photo with optional subtle drop shadow
  ctx.save();
  if (frameConfig.showDropShadow && frameConfig.paddingSize !== 'none' && style !== 'xpan-film') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 24 * scale;
    ctx.shadowOffsetY = 8 * scale;
  }

  // Combine Film Preset Filter & Cinematic Color Enhancement
  const filterParts: string[] = [];
  const filmFilterCss = computeFilmFilterCss(filmConfig);
  if (filmFilterCss && filmFilterCss !== 'none') {
    filterParts.push(filmFilterCss);
  }
  if (colorEnhance?.enabled) {
    if (colorEnhance.filterString) {
      filterParts.push(colorEnhance.filterString);
    } else {
      const c = colorEnhance.contrast ?? 1.14;
      const s = colorEnhance.saturate ?? 1.20;
      const b = colorEnhance.brightness ?? 1.02;
      filterParts.push(`contrast(${c}) saturate(${s}) brightness(${b})`);
    }
  }

  if (filterParts.length > 0) {
    ctx.filter = filterParts.join(' ');
  }

  // Draw image (with rotation/flip if applicable)
  if (cropState.rotation !== 0 || cropState.flipH) {
    ctx.save();
    ctx.translate(dX + dWidth / 2, dY + dHeight / 2);
    if (cropState.rotation !== 0) {
      ctx.rotate((cropState.rotation * Math.PI) / 180);
    }
    if (cropState.flipH) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(image, sX, sY, sWidth, sHeight, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
    ctx.restore();
  } else {
    ctx.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight);
  }

  ctx.filter = 'none';

  // Apply Film Grain to photo if enabled
  if (filmConfig?.grain && filmConfig.grain > 0) {
    drawFilmGrain(ctx, dX, dY, dWidth, dHeight, filmConfig.grain);
  }

  ctx.restore();

  // Draw Inner Border if enabled
  if (frameConfig.showInnerBorder && style !== 'xpan-film') {
    ctx.save();
    ctx.strokeStyle = frameConfig.frameColor === '#ffffff' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(dX, dY, dWidth, dHeight);
    ctx.restore();
  }

  // Special Style Decorations
  if (style === 'xpan-film') {
    drawXpanFilmDetails(ctx, canvasWidth, canvasHeight, dX, dY, dWidth, dHeight, scale, metadata, frameConfig);
  } else if (frameConfig.showMetadata) {
    drawStandardMetadata(ctx, canvasWidth, canvasHeight, dX, dY, dWidth, dHeight, scale, metadata, frameConfig);
  }

  // Draw Photographer Watermark Signature if enabled
  if (frameConfig.watermark?.enabled && frameConfig.watermark?.text) {
    drawWatermarkSignature(ctx, canvasWidth, canvasHeight, dX, dY, dWidth, dHeight, scale, frameConfig);
  }

  return canvas;
}

function drawXpanFilmDetails(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  photoX: number,
  photoY: number,
  photoW: number,
  photoH: number,
  scale: number,
  meta: PhotoMetadata,
  config: FrameConfig
) {
  ctx.save();

  // 1. Draw 35mm Film Perforations (Sprocket Holes)
  const holeW = 16 * scale;
  const holeH = 24 * scale;
  const holeRadius = 3 * scale;
  const holeSpacing = 36 * scale;

  ctx.fillStyle = '#050505';

  // Top and bottom sprocket rows
  const numHoles = Math.floor((canvasW - 40 * scale) / holeSpacing);
  const startX = (canvasW - numHoles * holeSpacing) / 2;

  const topHoleY = Math.max(8 * scale, (photoY - holeH) / 2);
  const botHoleY = photoY + photoH + Math.max(8 * scale, (canvasH - (photoY + photoH) - holeH) * 0.7);

  for (let i = 0; i < numHoles; i++) {
    const hx = startX + i * holeSpacing;
    drawRoundedRect(ctx, hx, topHoleY, holeW, holeH, holeRadius);
    drawRoundedRect(ctx, hx, botHoleY, holeW, holeH, holeRadius);
  }

  // 2. Film Stock Stamp / Edge Code (e.g. KODAK PORTRA 400 / HASSELBLAD XPAN)
  ctx.fillStyle = '#f59e0b'; // Classic amber film text
  ctx.font = `600 ${11 * scale}px 'JetBrains Mono', monospace`;
  ctx.letterSpacing = '1.5px';

  // Top Edge Text
  const topTextY = topHoleY + holeH + 11 * scale;
  ctx.fillText('HASSELBLAD XPAN · 24×65mm PANORAMA', photoX + 8 * scale, topTextY);
  ctx.fillText('EXP 24A · 400', photoX + photoW - 130 * scale, topTextY);

  // 3. Bottom Metadata Row
  if (config.showMetadata) {
    const botTextY = photoY + photoH + 20 * scale;

    // Left: Camera and Lens
    ctx.fillStyle = '#f3f4f6';
    ctx.font = `700 ${12 * scale}px 'Plus Jakarta Sans', sans-serif`;
    const title = `${meta.make} ${meta.model}`.trim();
    ctx.fillText(title, photoX, botTextY);

    if (meta.lens) {
      // Measure the title with the title's own font: switching the font first
      // made the lens text overlap the model name.
      const titleWidth = ctx.measureText(title).width;
      ctx.fillStyle = '#9ca3af';
      ctx.font = `400 ${10.5 * scale}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(` · ${meta.lens}`, photoX + titleWidth + 6 * scale, botTextY);
    }

    // Right: Exposure parameters in vintage golden text
    ctx.fillStyle = '#f59e0b';
    ctx.font = `500 ${11 * scale}px 'JetBrains Mono', monospace`;
    const params = `${meta.aperture}  ${meta.shutterSpeed}  ISO ${meta.iso}${meta.exposureBias ? `  ${meta.exposureBias}` : ''}`;
    const paramsW = ctx.measureText(params).width;
    ctx.fillText(params, photoX + photoW - paramsW, botTextY);

    // Optional location / date note
    if (meta.dateTime || meta.location) {
      ctx.fillStyle = '#6b7280';
      ctx.font = `400 ${9.5 * scale}px 'JetBrains Mono', monospace`;
      const sub = [meta.location, meta.dateTime].filter(Boolean).join('  ·  ');
      ctx.fillText(sub, photoX, botTextY + 16 * scale);
    }
  }

  ctx.restore();
}

function drawStandardMetadata(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  photoX: number,
  photoY: number,
  photoW: number,
  photoH: number,
  scale: number,
  meta: PhotoMetadata,
  config: FrameConfig
) {
  ctx.save();

  const isLight = config.frameColor === '#ffffff' || config.frameColor === '#f7f7f5' || config.frameColor === '#f5f2eb';
  const textColor = isLight ? '#111827' : '#f3f4f6';
  const subColor = isLight ? '#6b7280' : '#9ca3af';

  const metaCenterY = photoY + photoH + (canvasH - (photoY + photoH)) / 2;

  // Style variations
  if (config.styleId === 'leica-card') {
    // Red dot + elegant serif/sans
    const dotX = photoX + 6 * scale;
    const dotY = metaCenterY - 2 * scale;
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = `italic 700 ${12 * scale}px 'Instrument Serif', Georgia, serif`;
    ctx.fillText('Leica', dotX + 8 * scale, dotY + 4 * scale);

    const leicaOffset = dotX + 46 * scale;
    ctx.fillStyle = textColor;
    ctx.font = `600 ${12 * scale}px 'Plus Jakarta Sans', sans-serif`;
    const cam = `${meta.model}`.trim();
    ctx.fillText(cam, leicaOffset, dotY + 4 * scale);

    if (meta.lens) {
      const camWidth = ctx.measureText(cam).width;
      ctx.fillStyle = subColor;
      ctx.font = `400 ${10.5 * scale}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(` · ${meta.lens}`, leicaOffset + camWidth + 6 * scale, dotY + 4 * scale);
    }

    // Right: Exposure triangle
    ctx.fillStyle = subColor;
    ctx.font = `500 ${11 * scale}px 'JetBrains Mono', monospace`;
    const specs = `${meta.aperture}   ${meta.shutterSpeed}   ISO ${meta.iso}`;
    const specsW = ctx.measureText(specs).width;
    ctx.fillText(specs, photoX + photoW - specsW, dotY + 4 * scale);
  } else if (config.styleId === 'polaroid-vintage') {
    // Handwritten / typewriter centered caption
    const textY = photoY + photoH + 32 * scale;
    ctx.fillStyle = '#1f2937';
    ctx.font = `600 ${14 * scale}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    const caption = meta.photographer || meta.model || 'MEMORIES';
    ctx.fillText(caption, canvasW / 2, textY);

    ctx.fillStyle = '#6b7280';
    ctx.font = `400 ${10 * scale}px 'JetBrains Mono', monospace`;
    const info = [meta.dateTime, meta.location, `${meta.aperture} ${meta.shutterSpeed}`].filter(Boolean).join('  ·  ');
    ctx.fillText(info, canvasW / 2, textY + 18 * scale);
    ctx.textAlign = 'left';
  } else {
    // Default Modern Classic Gallery / Darkroom Matte
    // Left: Camera Make & Model + Lens
    ctx.fillStyle = textColor;
    ctx.font = `700 ${12.5 * scale}px 'Plus Jakarta Sans', sans-serif`;
    const camTitle = `${meta.make} ${meta.model}`.trim();
    ctx.fillText(camTitle, photoX, metaCenterY - 4 * scale);

    ctx.fillStyle = subColor;
    ctx.font = `400 ${10.5 * scale}px 'Plus Jakarta Sans', sans-serif`;
    const subTitle = [meta.lens || meta.focalLength, meta.photographer ? `Photo by ${meta.photographer}` : ''].filter(Boolean).join('  ·  ');
    ctx.fillText(subTitle, photoX, metaCenterY + 12 * scale);

    // Center: Color Palette dots if enabled
    if (config.showColorPalette && config.paletteColors && config.paletteColors.length > 0) {
      const dotCount = config.paletteColors.length;
      const dotR = 4 * scale;
      const dotGap = 12 * scale;
      const totalW = (dotCount - 1) * dotGap;
      const startDotX = canvasW / 2 - totalW / 2;

      config.paletteColors.forEach((color, idx) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(startDotX + idx * dotGap, metaCenterY, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.75 * scale;
        ctx.stroke();
      });
    }

    // Right: Exposure Triangle
    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.font = `600 ${11.5 * scale}px 'JetBrains Mono', monospace`;
    const expRow1 = `${meta.aperture}   ${meta.shutterSpeed}   ISO ${meta.iso}`;
    ctx.fillText(expRow1, photoX + photoW, metaCenterY - 4 * scale);

    ctx.fillStyle = subColor;
    ctx.font = `400 ${10 * scale}px 'JetBrains Mono', monospace`;
    const expRow2 = [meta.exposureBias && meta.exposureBias !== '0 EV' ? meta.exposureBias : null, meta.dateTime].filter(Boolean).join('   ');
    ctx.fillText(expRow2 || meta.dateTime, photoX + photoW, metaCenterY + 12 * scale);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function drawWatermarkSignature(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  photoX: number,
  photoY: number,
  photoW: number,
  photoH: number,
  scale: number,
  config: FrameConfig
) {
  const wm = config.watermark;
  if (!wm || !wm.text) return;

  ctx.save();

  const isLight = config.frameColor === '#ffffff' || config.frameColor === '#f7f7f5' || config.frameColor === '#f5f2eb' || config.frameColor === '#f4efe6' || config.frameColor === '#fdfbf7' || config.frameColor === '#f8f8f6';
  const textColor = isLight ? '#111827' : '#f3f4f6';

  // Opacity
  ctx.globalAlpha = Math.max(0.1, Math.min(1.0, wm.opacity ?? 0.8));
  ctx.fillStyle = textColor;

  // Font Size
  const baseSize = wm.size === 'sm' ? 10 * scale : wm.size === 'lg' ? 15 * scale : 12 * scale;
  let fontStr = '';

  if (wm.font === 'script') {
    fontStr = `600 ${baseSize * 1.35}px 'Caveat', cursive, Georgia, serif`;
  } else if (wm.font === 'serif') {
    fontStr = `700 ${baseSize * 0.95}px 'Cinzel', serif`;
  } else if (wm.font === 'mono') {
    fontStr = `500 ${baseSize * 0.9}px 'JetBrains Mono', monospace`;
  } else {
    fontStr = `600 ${baseSize}px 'Plus Jakarta Sans', sans-serif`;
  }

  ctx.font = fontStr;

  // Letter spacing if supported
  if (wm.letterSpacing === 'widest') {
    ctx.letterSpacing = `${3 * scale}px`;
  } else if (wm.letterSpacing === 'wide') {
    ctx.letterSpacing = `${1.5 * scale}px`;
  } else {
    ctx.letterSpacing = '0px';
  }

  // Calculate Y position:
  // If metadata is present, place watermark below the metadata line or at bottom padding
  let wmY: number;
  if (config.styleId === 'xpan-film') {
    wmY = canvasH - 12 * scale;
  } else if (config.showMetadata) {
    wmY = canvasH - 16 * scale;
  } else {
    wmY = photoY + photoH + (canvasH - (photoY + photoH)) / 2 + (baseSize / 3);
  }

  // Calculate X position & Text Align
  if (wm.position === 'center') {
    ctx.textAlign = 'center';
    ctx.fillText(wm.text, canvasW / 2, wmY);
  } else if (wm.position === 'left') {
    ctx.textAlign = 'left';
    ctx.fillText(wm.text, photoX, wmY);
  } else {
    // right
    ctx.textAlign = 'right';
    ctx.fillText(wm.text, photoX + photoW, wmY);
  }

  ctx.restore();
}

function drawFilmGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  intensity: number
) {
  try {
    const grainCanvas = document.createElement('canvas');
    const gw = 120;
    const gh = 120;
    grainCanvas.width = gw;
    grainCanvas.height = gh;
    const gctx = grainCanvas.getContext('2d');
    if (!gctx) return;

    const idata = gctx.createImageData(gw, gh);
    const data = idata.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    gctx.putImageData(idata, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = Math.min(0.35, (intensity / 100) * 0.28);
    const pattern = ctx.createPattern(grainCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  } catch (err) {
    console.warn('Grain rendering skipped', err);
  }
}
