export interface PhotoMetadata {
  make: string;
  model: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  exposureBias: string;
  dateTime: string;
  location: string;
  filmSimulation: string;
  photographer: string;
  aspectNote?: string;
}

export type AspectRatioId =
  | 'xpan-65-24'
  | 'cinema-239'
  | '1-1'
  | '3-2'
  | '2-3'
  | '4-3'
  | '3-4'
  | '16-9'
  | '9-16'
  | '4-5'
  | '6-7'
  | 'original';

export interface AspectRatioOption {
  id: AspectRatioId;
  label: string;
  ratioName: string;
  value: number; // width / height, e.g. 65 / 24
  category: 'cinema' | 'classic' | 'vertical' | 'social';
  description: string;
  isSpecial?: boolean; // Highlight XPan
}

export interface CropState {
  ratioId: AspectRatioId;
  ratioValue: number;
  zoom: number; // 1 to 3
  offsetX: number; // -50 to 50 percent
  offsetY: number; // -50 to 50 percent
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
}

export type FrameStyleId =
  | 'xpan-film'
  | 'classic-gallery'
  | 'darkroom-matte'
  | 'leica-card'
  | 'fuji-recipe'
  | 'polaroid-vintage'
  | 'cinema-letterbox'
  | 'minimal-bottom';

export interface FrameStyleOption {
  id: FrameStyleId;
  name: string;
  category: 'film' | 'gallery' | 'modern';
  tagline: string;
  defaultBg: string;
  defaultText: string;
}

export type WatermarkPosition = 'left' | 'center' | 'right';
export type WatermarkFont = 'sans' | 'serif' | 'script' | 'mono';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: WatermarkPosition;
  font: WatermarkFont;
  opacity: number; // 0.1 to 1.0
  size: 'sm' | 'md' | 'lg';
  letterSpacing: 'tight' | 'normal' | 'wide' | 'widest';
}

export type FilmPresetId =
  | 'none'
  | 'kodak-portra'
  | 'fuji-classic-chrome'
  | 'fuji-velvia'
  | 'leica-monochrome'
  | 'kodak-tri-x'
  | 'cinestill-800t'
  | 'ilford-hp5'
  | 'kodak-gold';

export interface FilmPresetOption {
  id: FilmPresetId;
  name: string;
  brand: 'Kodak' | 'Fujifilm' | 'Leica' | 'CineStill' | 'Ilford' | 'Original';
  tagline: string;
  category: 'color' | 'bw' | 'cinema';
  badgeColor: string;
  contrast: number;
  saturate: number;
  brightness: number;
  sepia: number;
  grayscale: number;
  hueRotate: number;
}

export interface FilmFilterConfig {
  presetId: FilmPresetId;
  strength: number; // 0 to 100
  grain: number; // 0 to 100
}

export interface FrameConfig {
  styleId: FrameStyleId;
  frameColor: string;
  textColor: string;
  paddingSize: 'none' | 'compact' | 'medium' | 'generous';
  showMetadata: boolean;
  showCameraLogo: boolean;
  showColorPalette: boolean;
  showFilmPerforations: boolean;
  showDropShadow: boolean;
  showInnerBorder: boolean;
  borderRadius: number;
  fontStyle: 'sans' | 'serif' | 'mono';
  brandLogo: string; // 'hasselblad' | 'leica' | 'fujifilm' | 'sony' | 'canon' | 'nikon' | 'apple' | 'ricoh' | 'none'
  paletteColors: string[];
  watermark: WatermarkConfig;
}
