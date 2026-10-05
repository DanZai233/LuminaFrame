import { FilmFilterConfig, FilmPresetOption } from '../types';

export const FILM_PRESETS: FilmPresetOption[] = [
  {
    id: 'none',
    name: '原片直出',
    brand: 'Original',
    tagline: '保留照片原始色彩与曝光设定，不叠加任何胶片滤镜',
    category: 'color',
    badgeColor: '#71717a',
    contrast: 1.0,
    saturate: 1.0,
    brightness: 1.0,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
  },
  {
    id: 'kodak-portra',
    name: 'Kodak Portra 400',
    brand: 'Kodak',
    tagline: '传奇人像胶卷，温润细腻的肤色过渡与柔和浅暖色高光',
    category: 'color',
    badgeColor: '#f59e0b',
    contrast: 1.08,
    saturate: 1.16,
    brightness: 1.03,
    sepia: 0.08,
    grayscale: 0,
    hueRotate: -2,
  },
  {
    id: 'fuji-classic-chrome',
    name: 'Fuji Classic Chrome',
    brand: 'Fujifilm',
    tagline: '富士经典正片，微低饱和度与深邃暗部，纪实人文杂志质感',
    category: 'color',
    badgeColor: '#10b981',
    contrast: 1.16,
    saturate: 0.88,
    brightness: 0.98,
    sepia: 0.04,
    grayscale: 0,
    hueRotate: 0,
  },
  {
    id: 'fuji-velvia',
    name: 'Fuji Velvia 50',
    brand: 'Fujifilm',
    tagline: '富士反转片王者，浓郁鲜艳的超高饱和度，风光自然绝配',
    category: 'color',
    badgeColor: '#059669',
    contrast: 1.18,
    saturate: 1.36,
    brightness: 1.02,
    sepia: 0,
    grayscale: 0,
    hueRotate: 2,
  },
  {
    id: 'leica-monochrome',
    name: 'Leica M Monochrom',
    brand: 'Leica',
    tagline: '德味黑白颗粒，深邃高微反差与极具雕塑感的黑白光影',
    category: 'bw',
    badgeColor: '#ef4444',
    contrast: 1.34,
    saturate: 0,
    brightness: 1.04,
    sepia: 0,
    grayscale: 1.0,
    hueRotate: 0,
  },
  {
    id: 'kodak-tri-x',
    name: 'Kodak Tri-X 400',
    brand: 'Kodak',
    tagline: '街头纪实黑白标杆，经典的银盐颗粒灰阶与厚重暗部',
    category: 'bw',
    badgeColor: '#f59e0b',
    contrast: 1.20,
    saturate: 0,
    brightness: 1.02,
    sepia: 0,
    grayscale: 1.0,
    hueRotate: 0,
  },
  {
    id: 'cinestill-800t',
    name: 'CineStill 800T',
    brand: 'CineStill',
    tagline: '电影钨丝灯胶片，冷青调暗部与迷人夜景氛围',
    category: 'cinema',
    badgeColor: '#06b6d4',
    contrast: 1.15,
    saturate: 1.20,
    brightness: 0.99,
    sepia: 0,
    grayscale: 0,
    hueRotate: 12,
  },
  {
    id: 'ilford-hp5',
    name: 'Ilford HP5 Plus',
    brand: 'Ilford',
    tagline: '英国传统银盐黑白，宽容度极高，明暗层次柔和平滑',
    category: 'bw',
    badgeColor: '#a1a1aa',
    contrast: 1.12,
    saturate: 0,
    brightness: 1.04,
    sepia: 0,
    grayscale: 1.0,
    hueRotate: 0,
  },
  {
    id: 'kodak-gold',
    name: 'Kodak Gold 200',
    brand: 'Kodak',
    tagline: '经典复古金胶，沐浴夏日阳光般的金黄暖调与温暖回味',
    category: 'color',
    badgeColor: '#eab308',
    contrast: 1.10,
    saturate: 1.22,
    brightness: 1.04,
    sepia: 0.14,
    grayscale: 0,
    hueRotate: -4,
  },
];

export function computeFilmFilterCss(config?: FilmFilterConfig): string {
  if (!config || config.presetId === 'none' || config.strength <= 0) return 'none';
  const preset = FILM_PRESETS.find((p) => p.id === config.presetId);
  if (!preset) return 'none';

  const t = Math.max(0, Math.min(100, config.strength)) / 100;

  // Linear interpolation from neutral baseline to preset target
  const contrast = 1 + (preset.contrast - 1) * t;
  const saturate = 1 + (preset.saturate - 1) * t;
  const brightness = 1 + (preset.brightness - 1) * t;
  const sepia = preset.sepia * t;
  const grayscale = preset.grayscale * t;
  const hueRotate = preset.hueRotate * t;

  const parts: string[] = [];
  if (Math.abs(contrast - 1) > 0.005) parts.push(`contrast(${contrast.toFixed(2)})`);
  if (Math.abs(saturate - 1) > 0.005) parts.push(`saturate(${saturate.toFixed(2)})`);
  if (Math.abs(brightness - 1) > 0.005) parts.push(`brightness(${brightness.toFixed(2)})`);
  if (sepia > 0.005) parts.push(`sepia(${sepia.toFixed(2)})`);
  if (grayscale > 0.005) parts.push(`grayscale(${grayscale.toFixed(2)})`);
  if (Math.abs(hueRotate) >= 0.5) parts.push(`hue-rotate(${Math.round(hueRotate)}deg)`);

  return parts.length > 0 ? parts.join(' ') : 'none';
}
