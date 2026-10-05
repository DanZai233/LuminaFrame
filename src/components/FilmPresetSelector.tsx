import React, { useState } from 'react';
import { FilmFilterConfig, FilmPresetId, FilmPresetOption } from '../types';
import { FILM_PRESETS } from '../utils/filmPresets';
import { Clapperboard, Sparkles, Sliders, Check, RefreshCw, Eye } from 'lucide-react';

interface FilmPresetSelectorProps {
  filmConfig: FilmFilterConfig;
  onChangeFilmConfig: (updater: (prev: FilmFilterConfig) => FilmFilterConfig) => void;
  onSyncToMetadata?: (filmName: string) => void;
}

export const FilmPresetSelector: React.FC<FilmPresetSelectorProps> = ({
  filmConfig,
  onChangeFilmConfig,
  onSyncToMetadata,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'color' | 'bw' | 'cinema'>('all');

  const filteredPresets = FILM_PRESETS.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  const activePreset = FILM_PRESETS.find((p) => p.id === filmConfig.presetId) || FILM_PRESETS[0];

  return (
    <div className="space-y-4">
      {/* Top Banner with Active Preset Summary & Quick Sliders */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  当前胶片预设：{activePreset.name}
                </span>
                {activePreset.id !== 'none' && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                    style={{ backgroundColor: `${activePreset.badgeColor}20`, color: activePreset.badgeColor }}
                  >
                    {activePreset.brand}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                {activePreset.tagline}
              </p>
            </div>
          </div>

          {activePreset.id !== 'none' && onSyncToMetadata && (
            <button
              type="button"
              onClick={() => onSyncToMetadata(activePreset.name)}
              className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              title="将此胶卷型号同步至照片EXIF底片模拟标签"
            >
              <RefreshCw className="w-3 h-3" />
              <span>同步名称至 EXIF 标签</span>
            </button>
          )}
        </div>

        {/* Intensity & Grain Sliders */}
        {activePreset.id !== 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 animate-fade-in">
            {/* 1. Strength Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>预设滤镜强度</span>
                </span>
                <span className="font-mono text-amber-400 font-semibold text-xs">
                  {filmConfig.strength}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={filmConfig.strength}
                onChange={(e) =>
                  onChangeFilmConfig((prev) => ({
                    ...prev,
                    strength: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />

              {/* Quick Intensity Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[
                  { val: 30, label: '30% 轻透' },
                  { val: 60, label: '60% 柔和' },
                  { val: 80, label: '80% 经典' },
                  { val: 100, label: '100% 浓郁' },
                ].map((st) => (
                  <button
                    key={st.val}
                    type="button"
                    onClick={() =>
                      onChangeFilmConfig((prev) => ({ ...prev, strength: st.val }))
                    }
                    className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer text-center ${
                      filmConfig.strength === st.val
                        ? 'bg-amber-400 text-zinc-950 font-bold'
                        : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Grain Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>银盐胶片颗粒感</span>
                </span>
                <span className="font-mono text-zinc-300 text-xs">
                  {filmConfig.grain > 0 ? `${filmConfig.grain}%` : '关闭'}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filmConfig.grain}
                onChange={(e) =>
                  onChangeFilmConfig((prev) => ({
                    ...prev,
                    grain: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                <span>纯净无颗粒 (0%)</span>
                <span>细腻微粒 (30%)</span>
                <span>经典粗颗粒 (80%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs font-medium overflow-x-auto">
        {[
          { id: 'all', label: '全部胶卷 (All)' },
          { id: 'color', label: '彩色负片与反转 (Color)' },
          { id: 'bw', label: '经典黑白颗粒 (B&W)' },
          { id: 'cinema', label: '电影夜色胶卷 (Cinema)' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id as any)}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-zinc-800 text-amber-400 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredPresets.map((preset) => {
          const isSelected = filmConfig.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChangeFilmConfig((prev) => ({
                  ...prev,
                  presetId: preset.id,
                  // If switching from none to a preset and strength was 0, reset strength to 85%
                  strength: prev.strength === 0 ? 85 : prev.strength,
                }))
              }
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-amber-400 bg-zinc-800/90 shadow-md ring-1 ring-amber-400/40'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: preset.badgeColor }}
                    />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {preset.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5 inline-block">
                    {preset.brand} · {preset.category === 'bw' ? '黑白银盐' : preset.category === 'cinema' ? '电影钨丝灯' : '彩色胶片'}
                  </span>
                </div>

                {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              </div>

              <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                {preset.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
