import { PhotoMetadata } from '../types';

export interface SamplePhoto {
  id: string;
  name: string;
  category: string;
  url: string;
  defaultRatio: string;
  defaultStyle: string;
  metadata: PhotoMetadata;
  brandId: string;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'xpan-shinjuku',
    name: '新宿雨夜 · 宽幅街头',
    category: 'XPAN 65:24 宽幅',
    url: '/src/assets/images/sample_xpan_street_1791190366054.jpg',
    defaultRatio: 'xpan-65-24',
    defaultStyle: 'xpan-film',
    brandId: 'hasselblad',
    metadata: {
      make: 'HASSELBLAD',
      model: 'XPAN II',
      lens: 'HASSELBLAD 45mm F4',
      focalLength: '45mm',
      aperture: 'f/4.0',
      shutterSpeed: '1/60s',
      iso: '400',
      exposureBias: '-0.3 EV',
      dateTime: '2026.04.18  20:15:32',
      location: 'Tokyo, Shinjuku (35°41\'N 139°42\'E)',
      filmSimulation: 'Kodak Portra 400',
      photographer: 'Chen Zhi',
      aspectNote: 'HASSELBLAD XPAN 24×65mm',
    },
  },
  {
    id: 'mist-mountain',
    name: '晨雾雪脊 · 纯粹自然',
    category: '风光中画幅',
    url: '/src/assets/images/sample_mountain_mist_1791190375650.jpg',
    defaultRatio: '16-9',
    defaultStyle: 'classic-gallery',
    brandId: 'hasselblad',
    metadata: {
      make: 'HASSELBLAD',
      model: 'X2D 100C',
      lens: 'XCD 38mm F2.5 V',
      focalLength: '38mm',
      aperture: 'f/8.0',
      shutterSpeed: '1/320s',
      iso: '64',
      exposureBias: '0 EV',
      dateTime: '2026.03.22  06:48:10',
      location: 'Dolomites, Italy (46°26\'N 11°51\'E)',
      filmSimulation: 'Natural Color Solution',
      photographer: 'Chen Zhi',
      aspectNote: 'Medium Format 100MP',
    },
  },
  {
    id: 'vintage-cafe',
    name: '午后咖啡 · 胶片记忆',
    category: '人文静物',
    url: '/src/assets/images/sample_vintage_cafe_1791190384888.jpg',
    defaultRatio: '3-2',
    defaultStyle: 'leica-card',
    brandId: 'leica',
    metadata: {
      make: 'LEICA',
      model: 'M11',
      lens: 'SUMMILUX-M 35mm f/1.4 ASPH.',
      focalLength: '35mm',
      aperture: 'f/1.4',
      shutterSpeed: '1/125s',
      iso: '200',
      exposureBias: '+0.3 EV',
      dateTime: '2026.02.14  15:20:41',
      location: 'Kyoto, Gion (35°00\'N 135°46\'E)',
      filmSimulation: 'Leica Classic Look',
      photographer: 'Chen Zhi',
      aspectNote: '35mm Rangefinder',
    },
  },
  {
    id: 'urban-brutalism',
    name: '几何秩序 · 建筑光影',
    category: '现代建筑',
    url: '/src/assets/images/sample_urban_architecture_1791190393766.jpg',
    defaultRatio: '4-3',
    defaultStyle: 'darkroom-matte',
    brandId: 'fujifilm',
    metadata: {
      make: 'FUJIFILM',
      model: 'GFX 100S II',
      lens: 'GF 30mm F3.5 R WR',
      focalLength: '30mm',
      aperture: 'f/5.6',
      shutterSpeed: '1/500s',
      iso: '100',
      exposureBias: '0 EV',
      dateTime: '2026.01.29  11:34:02',
      location: 'Berlin (52°31\'N 13°24\'E)',
      filmSimulation: 'Classic Chrome',
      photographer: 'Chen Zhi',
      aspectNote: 'Medium Format 4:3',
    },
  },
];
