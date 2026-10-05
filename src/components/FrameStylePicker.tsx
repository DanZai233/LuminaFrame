import React from 'react';
import { FrameConfig, FrameStyleId } from '../types';
import { Sparkles, Palette, Layers, Sliders, Check } from 'lucide-react';

interface FrameStylePickerProps {
  frameConfig: FrameConfig;
  onChangeConfig: (updater: (prev: FrameConfig) => FrameConfig) => void;
  isXPanRatio: boolean;
}

interface StylePreset {
  id: FrameStyleId;
  name: string;
  tagline: string;
  color: string;
  isFilm?: boolean;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'xpan-film',
    name: 'XPAN 电影底片',
    tagline: '35mm齿孔与柯达/哈苏暗盒印字，电影质感',
    color: '#0a0a0c',
    isFilm: true,
  },
  {
    id: 'classic-gallery',
    name: '美术馆白卡装裱',
    tagline: '现代艺术展经典白底留白与参数排版',
    color: '#ffffff',
  },
  {
    id: 'darkroom-matte',
    name: '黑曜石暗房亚光',
    tagline: '深邃哑光灰黑质感，香槟银高阶字色',
    color: '#121215',
  },
  {
    id: 'leica-card',
    name: '徕卡质感红标',
    tagline: '经典德味红点标识与极简排版',
    color: '#ffffff',
  },
  {
    id: 'fuji-recipe',
    name: '富士胶片色卡',
    tagline: '胶片模拟标签与画面提取5原色色块',
    color: '#f8f8f6',
  },
  {
    id: 'polaroid-vintage',
    name: '复古即显拍立得',
    tagline: '下部宽画幅留白与人文手写印章',
    color: '#fdfbf7',
  },
  {
    id: 'minimal-bottom',
    name: '极简悬浮下栏',
    tagline: '无边框沉浸体验，纯净参数水印',
    color: '#111111',
  },
];

const COLOR_SWATCHES = [
  { label: '纯白', hex: '#ffffff', border: '#e4e4e7' },
  { label: '美术馆米白', hex: '#f7f7f5', border: '#d4d4d8' },
  { label: '复古暖宣纸', hex: '#f4efe6', border: '#d6cfc4' },
  { label: '底片黑', hex: '#0a0a0c', border: '#27272a' },
  { label: '黑曜石', hex: '#141418', border: '#27272a' },
  { label: '深炭灰', hex: '#202024', border: '#3f3f46' },
];

export const FrameStylePicker: React.FC<FrameStylePickerProps> = ({
  frameConfig,
  onChangeConfig,
  isXPanRatio,
}) => {
  return (
    <div className="space-y-4">
      {/* Frame Styles Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>相框风格套件</span>
          </span>
          {isXPanRatio && (
            <span className="text-[11px] text-amber-400 font-mono">
              ★ 推荐搭配「XPAN 电影底片」风格
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = frameConfig.styleId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onChangeConfig((prev) => ({
                    ...prev,
                    styleId: preset.id,
                    frameColor: preset.color,
                    showFilmPerforations: preset.id === 'xpan-film',
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-amber-400 bg-zinc-800/90 shadow-md ring-1 ring-amber-400/30'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border shadow-xs shrink-0"
                      style={{ backgroundColor: preset.color, borderColor: '#52525b' }}
                    />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {preset.name}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Dimensions & Color Options */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3.5">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold border-b border-zinc-800 pb-2">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>边框微调与色彩材质</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Padding Thickness */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 font-medium">边框留白厚度</label>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-zinc-950/80 rounded-lg border border-zinc-800">
              {(
                [
                  { id: 'none', label: '无边框' },
                  { id: 'compact', label: '紧凑' },
                  { id: 'medium', label: '适中' },
                  { id: 'generous', label: '大画廊' },
                ] as const
              ).map((pad) => (
                <button
                  key={pad.id}
                  onClick={() => onChangeConfig((prev) => ({ ...prev, paddingSize: pad.id }))}
                  className={`py-1 text-[11px] font-medium rounded transition-colors cursor-pointer text-center ${
                    frameConfig.paddingSize === pad.id
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {pad.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Background Color */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 font-medium">卡纸背景色调</label>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  onClick={() => onChangeConfig((prev) => ({ ...prev, frameColor: swatch.hex }))}
                  className={`w-7 h-7 rounded-lg border transition-all cursor-pointer relative flex items-center justify-center ${
                    frameConfig.frameColor === swatch.hex
                      ? 'ring-2 ring-amber-400 scale-110 shadow-xs'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex, borderColor: swatch.border }}
                  title={swatch.label}
                >
                  {frameConfig.frameColor === swatch.hex && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: swatch.hex === '#ffffff' || swatch.hex.startsWith('#f') ? '#18181b' : '#ffffff',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-800/80">
          <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60 cursor-pointer hover:bg-zinc-800/40 transition-colors">
            <input
              type="checkbox"
              checked={frameConfig.showMetadata}
              onChange={(e) => onChangeConfig((prev) => ({ ...prev, showMetadata: e.target.checked }))}
              className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="text-[11px] text-zinc-300">显示相机参数</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60 cursor-pointer hover:bg-zinc-800/40 transition-colors">
            <input
              type="checkbox"
              checked={frameConfig.showColorPalette}
              onChange={(e) => onChangeConfig((prev) => ({ ...prev, showColorPalette: e.target.checked }))}
              className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="text-[11px] text-zinc-300">提取画面色卡</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60 cursor-pointer hover:bg-zinc-800/40 transition-colors">
            <input
              type="checkbox"
              checked={frameConfig.showDropShadow}
              onChange={(e) => onChangeConfig((prev) => ({ ...prev, showDropShadow: e.target.checked }))}
              className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="text-[11px] text-zinc-300">内嵌立体微阴影</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60 cursor-pointer hover:bg-zinc-800/40 transition-colors">
            <input
              type="checkbox"
              checked={frameConfig.showInnerBorder}
              onChange={(e) => onChangeConfig((prev) => ({ ...prev, showInnerBorder: e.target.checked }))}
              className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="text-[11px] text-zinc-300">内圈细线压印</span>
          </label>
        </div>
      </div>
    </div>
  );
};
