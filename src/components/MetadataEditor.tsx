import React from 'react';
import { PhotoMetadata } from '../types';
import { Camera, Calendar, MapPin, User, Aperture, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { detectBrandId } from '../utils/exifParser';

interface MetadataEditorProps {
  metadata: PhotoMetadata;
  onChangeMetadata: (updated: Partial<PhotoMetadata>) => void;
  onSetBrand: (brandId: string) => void;
  currentBrandId: string;
}

const CAMERA_PRESETS = [
  {
    name: 'HASSELBLAD XPAN II',
    make: 'HASSELBLAD',
    model: 'XPAN II',
    lens: 'HASSELBLAD 45mm F4',
    aperture: 'f/4.0',
    shutter: '1/250s',
    iso: '200',
    brandId: 'hasselblad',
    film: 'XPAN 24×65mm Panorama',
  },
  {
    name: 'LEICA M11',
    make: 'LEICA',
    model: 'M11',
    lens: 'SUMMILUX-M 35mm f/1.4 ASPH.',
    aperture: 'f/1.4',
    shutter: '1/500s',
    iso: '100',
    brandId: 'leica',
    film: 'Leica M Classic',
  },
  {
    name: 'FUJIFILM X100VI',
    make: 'FUJIFILM',
    model: 'X100VI',
    lens: '23mm F2.0 II',
    aperture: 'f/2.0',
    shutter: '1/1000s',
    iso: '125',
    brandId: 'fujifilm',
    film: 'Classic Chrome',
  },
  {
    name: 'SONY A7R V',
    make: 'SONY',
    model: 'ILCE-7RM5',
    lens: 'FE 24-70mm F2.8 GM II',
    aperture: 'f/2.8',
    shutter: '1/160s',
    iso: '100',
    brandId: 'sony',
    film: 'Natural Neutral',
  },
  {
    name: 'RICOH GR IIIx',
    make: 'RICOH',
    model: 'GR IIIx',
    lens: 'GR LENS 26.1mm F2.8',
    aperture: 'f/2.8',
    shutter: '1/400s',
    iso: '200',
    brandId: 'ricoh',
    film: 'Positive Film',
  },
  {
    name: 'APPLE iPhone 16 Pro',
    make: 'APPLE',
    model: 'iPhone 16 Pro',
    lens: 'Main Camera 24mm f/1.78',
    aperture: 'f/1.78',
    shutter: '1/120s',
    iso: '64',
    brandId: 'apple',
    film: 'Standard Photographic Style',
  },
];

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  metadata,
  onChangeMetadata,
  onSetBrand,
  currentBrandId,
}) => {
  const handlePresetSelect = (preset: typeof CAMERA_PRESETS[0]) => {
    onChangeMetadata({
      make: preset.make,
      model: preset.model,
      lens: preset.lens,
      aperture: preset.aperture,
      shutterSpeed: preset.shutter,
      iso: preset.iso,
      filmSimulation: preset.film,
    });
    onSetBrand(preset.brandId);
  };

  return (
    <div className="space-y-4">
      {/* Quick Camera Presets Header */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>一键套用经典相机风格预设</span>
          </span>
          <span className="text-[11px] text-zinc-500">点击自动填充机型与镜头参数</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CAMERA_PRESETS.map((preset) => {
            const isMatch = metadata.model.toLowerCase().includes(preset.model.toLowerCase());
            return (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  isMatch
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50'
                }`}
              >
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Metadata Form */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold border-b border-zinc-800 pb-2">
          <span className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>照片元数据 (EXIF 自动提取与自定义编辑)</span>
          </span>
          <span className="text-[11px] text-zinc-500 font-normal">支持直接修改，实时同步相框展示</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Camera Brand & Model */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">相机品牌 (Make)</label>
            <input
              type="text"
              value={metadata.make}
              onChange={(e) => {
                const val = e.target.value;
                onChangeMetadata({ make: val });
                onSetBrand(detectBrandId(val, metadata.model));
              }}
              placeholder="e.g. HASSELBLAD"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">机身型号 (Model)</label>
            <input
              type="text"
              value={metadata.model}
              onChange={(e) => onChangeMetadata({ model: e.target.value })}
              placeholder="e.g. XPAN II"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">镜头信息 (Lens)</label>
            <input
              type="text"
              value={metadata.lens}
              onChange={(e) => onChangeMetadata({ lens: e.target.value })}
              placeholder="e.g. 45mm F4"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Exposure Triangle */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Aperture className="w-3 h-3 text-amber-400" />
              <span>光圈值 (Aperture)</span>
            </label>
            <input
              type="text"
              value={metadata.aperture}
              onChange={(e) => onChangeMetadata({ aperture: e.target.value })}
              placeholder="e.g. f/4.0"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>快门速度 (Shutter)</span>
            </label>
            <input
              type="text"
              value={metadata.shutterSpeed}
              onChange={(e) => onChangeMetadata({ shutterSpeed: e.target.value })}
              placeholder="e.g. 1/250s"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">感光度 (ISO)</label>
            <input
              type="text"
              value={metadata.iso}
              onChange={(e) => onChangeMetadata({ iso: e.target.value })}
              placeholder="e.g. 200"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Date, Location, Author */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>拍摄时间 (Date & Time)</span>
            </label>
            <input
              type="text"
              value={metadata.dateTime}
              onChange={(e) => onChangeMetadata({ dateTime: e.target.value })}
              placeholder="YYYY.MM.DD  HH:mm"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-zinc-400" />
              <span>拍摄地点 (Location / GPS)</span>
            </label>
            <input
              type="text"
              value={metadata.location}
              onChange={(e) => onChangeMetadata({ location: e.target.value })}
              placeholder="e.g. Tokyo, Shinjuku"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-400" />
              <span>创作者签名 (Photographer)</span>
            </label>
            <input
              type="text"
              value={metadata.photographer}
              onChange={(e) => onChangeMetadata({ photographer: e.target.value })}
              placeholder="e.g. Photo by Alex"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Film simulation & Custom note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">底片色彩 / 胶片模拟 (Film Simulation)</label>
            <input
              type="text"
              value={metadata.filmSimulation}
              onChange={(e) => onChangeMetadata({ filmSimulation: e.target.value })}
              placeholder="e.g. Kodak Portra 400 / XPAN 24×65mm"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">曝光补偿 (EV)</label>
            <input
              type="text"
              value={metadata.exposureBias}
              onChange={(e) => onChangeMetadata({ exposureBias: e.target.value })}
              placeholder="e.g. 0 EV / +0.3 EV"
              className="w-full px-2.5 py-1.5 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
