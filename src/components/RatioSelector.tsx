import React from 'react';
import { ASPECT_RATIOS } from '../utils/aspectRatios';
import { AspectRatioId, AspectRatioOption } from '../types';
import { Film, Compass, Smartphone, Monitor } from 'lucide-react';

interface RatioSelectorProps {
  currentRatioId: AspectRatioId;
  onSelectRatio: (ratio: AspectRatioOption) => void;
  originalDimensions?: { width: number; height: number };
}

export const RatioSelector: React.FC<RatioSelectorProps> = ({
  currentRatioId,
  onSelectRatio,
  originalDimensions,
}) => {
  // Find currently selected
  const activeOption = ASPECT_RATIOS.find((r) => r.id === currentRatioId) || ASPECT_RATIOS[0];

  return (
    <div className="space-y-4">
      {/* Featured XPAN Callout Card */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-zinc-900/90 p-4 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                <Film className="w-3.5 h-3.5" /> 传奇画幅重点推荐
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">24×65mm</span>
            </div>
            <h4 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>HASSELBLAD XPAN 65:24</span>
              <span className="text-xs font-mono text-amber-400 font-normal">~2.71:1 全景</span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
              哈苏与富士合作诞生的传奇全景双画幅胶片相机比例。将标准35mm胶片延展为超宽视界，电影感与空间叙事张力极强。
            </p>
          </div>

          <button
            onClick={() => onSelectRatio(ASPECT_RATIOS[0])}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
              currentRatioId === 'xpan-65-24'
                ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/30'
                : 'bg-zinc-800 text-zinc-200 hover:bg-amber-400 hover:text-zinc-950 border border-zinc-700/60'
            }`}
          >
            {currentRatioId === 'xpan-65-24' ? '✓ 当前已启用 XPAN' : '一键应用 XPAN 宽幅'}
          </button>
        </div>
      </div>

      {/* Categorized Ratio Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">所有比例选择</span>
          <span className="text-[11px] text-zinc-500">点击即时裁切预览</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {ASPECT_RATIOS.map((item) => {
            const isSelected = item.id === currentRatioId;
            return (
              <button
                key={item.id}
                onClick={() => onSelectRatio(item)}
                className={`group text-left p-2.5 rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-amber-400/80 bg-zinc-800/90 text-white shadow-sm ring-1 ring-amber-400/30'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                {/* Visual Ratio Box Preview */}
                <div className="h-9 w-full flex items-center justify-center mb-2 bg-zinc-950/60 rounded">
                  <div
                    className={`border transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/20'
                        : 'border-zinc-600 group-hover:border-zinc-400'
                    }`}
                    style={{
                      width:
                        item.value === 0
                          ? '28px'
                          : item.value >= 1
                          ? '34px'
                          : `${Math.round(28 * item.value)}px`,
                      height:
                        item.value === 0
                          ? '22px'
                          : item.value >= 1
                          ? `${Math.round(34 / Math.min(3, item.value))}px`
                          : '28px',
                    }}
                  />
                </div>

                <div className="flex items-baseline justify-between gap-1">
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                    {item.label}
                  </div>
                  {item.isSpecial && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-mono">
                      XPAN
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {item.ratioName}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Ratio Explanation */}
      <div className="text-xs text-zinc-400 bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-3 flex items-start gap-2.5">
        <Compass className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="text-zinc-200 font-medium">
            当前构图：{activeOption.label} · {activeOption.ratioName}
          </div>
          <div className="text-[11px] text-zinc-400">
            {activeOption.description}
            {originalDimensions && (
              <span className="text-zinc-500 ml-2 font-mono">
                [原图尺寸: {originalDimensions.width} × {originalDimensions.height} px]
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
