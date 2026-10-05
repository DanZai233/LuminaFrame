import React from 'react';
import { WatermarkConfig, WatermarkFont, WatermarkPosition } from '../types';
import { Feather, AlignLeft, AlignCenter, AlignRight, Sliders, Type, Sparkles } from 'lucide-react';

interface WatermarkEditorProps {
  watermark: WatermarkConfig;
  onChangeWatermark: (updater: (prev: WatermarkConfig) => WatermarkConfig) => void;
  photographerName?: string;
}

const QUICK_PREFIXES = [
  'Photo by',
  'Shot by',
  'Shot on XPAN',
  'Captured by',
  '摄影 /',
  '©',
];

const FONT_OPTIONS: { id: WatermarkFont; label: string; preview: string; className: string }[] = [
  { id: 'script', label: '花体手写印签', preview: 'Signature', className: 'font-script-signature text-base' },
  { id: 'serif', label: '艺术典雅衬线', preview: 'FINE ART', className: 'font-serif-display text-xs tracking-wider' },
  { id: 'sans', label: '现代极简无衬线', preview: 'Modern Sans', className: 'font-sans text-xs font-semibold' },
  { id: 'mono', label: '复古打字机等宽', preview: 'RETRO MONO', className: 'font-mono-data text-xs' },
];

export const WatermarkEditor: React.FC<WatermarkEditorProps> = ({
  watermark,
  onChangeWatermark,
  photographerName,
}) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Top Toggle Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            相框底部拍摄者水印签名
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            自定义排版、签名文本、位置与透明度
          </span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) =>
              onChangeWatermark((prev) => ({ ...prev, enabled: e.target.checked }))
            }
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
          <span className="ml-2 text-xs font-medium text-zinc-300">
            {watermark.enabled ? '已开启' : '已关闭'}
          </span>
        </label>
      </div>

      {watermark.enabled && (
        <div className="space-y-4 pt-1 animate-fade-in">
          {/* Text Input with Quick Prefixes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-zinc-400 font-medium">水印签名文本</label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500">快捷前缀：</span>
                {QUICK_PREFIXES.map((prefix) => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => {
                      const name = photographerName || 'Chen Zhi';
                      onChangeWatermark((prev) => ({
                        ...prev,
                        text: `${prefix} ${name}`.trim(),
                      }));
                    }}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={watermark.text}
                onChange={(e) =>
                  onChangeWatermark((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="例如：Photo by Chen Zhi 或 © 2026 LUMINA"
                className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Position & Font & Opacity Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* 1. Position Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                <span>对齐位置</span>
                <span className="text-[10px] text-zinc-500">
                  {watermark.position === 'left' ? '居左' : watermark.position === 'center' ? '居中' : '居右'}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-1 p-0.5 bg-zinc-950/80 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => onChangeWatermark((prev) => ({ ...prev, position: 'left' }))}
                  className={`py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    watermark.position === 'left'
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="靠左对齐"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>居左</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeWatermark((prev) => ({ ...prev, position: 'center' }))}
                  className={`py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    watermark.position === 'center'
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="居中对齐"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>居中</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeWatermark((prev) => ({ ...prev, position: 'right' }))}
                  className={`py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    watermark.position === 'right'
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="靠右对齐"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                  <span>居右</span>
                </button>
              </div>
            </div>

            {/* 2. Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>透明度</span>
                </span>
                <span className="font-mono text-zinc-300 font-semibold">
                  {Math.round(watermark.opacity * 100)}%
                </span>
              </div>

              <div className="pt-2">
                <input
                  type="range"
                  min="0.15"
                  max="1.0"
                  step="0.05"
                  value={watermark.opacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onChangeWatermark((prev) => ({ ...prev, opacity: val }));
                  }}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
              </div>

              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>微弱隐蔽 (15%)</span>
                <span>半透柔和 (50%)</span>
                <span>鲜明实色 (100%)</span>
              </div>
            </div>

            {/* 3. Font Size & Letter Spacing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <span>字号与间距</span>
                <span className="text-[10px] text-zinc-500">
                  {watermark.size === 'sm' ? '精致小号' : watermark.size === 'lg' ? '醒目大号' : '标准中号'}
                </span>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 rounded-lg border border-zinc-800">
                {(
                  [
                    { id: 'sm', label: '小' },
                    { id: 'md', label: '中' },
                    { id: 'lg', label: '大' },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => onChangeWatermark((prev) => ({ ...prev, size: sz.id }))}
                    className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      watermark.size === sz.id
                        ? 'bg-amber-400 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}

                <div className="h-4 w-px bg-zinc-800 mx-0.5" />

                {(
                  [
                    { id: 'normal', label: '标准距' },
                    { id: 'widest', label: '艺术宽距' },
                  ] as const
                ).map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onChangeWatermark((prev) => ({ ...prev, letterSpacing: sp.id }))}
                    className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      watermark.letterSpacing === sp.id
                        ? 'bg-zinc-700 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Font Family Selection Cards */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Type className="w-3 h-3 text-amber-400" />
              <span>签名艺术字体</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FONT_OPTIONS.map((f) => {
                const isSelected = watermark.font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChangeWatermark((prev) => ({ ...prev, font: f.id }))}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-zinc-800 text-white ring-1 ring-amber-400/40'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[11px] text-zinc-400 mb-1">{f.label}</div>
                    <div className={`${f.className} text-amber-400 truncate`}>
                      {watermark.text || f.preview}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Watermark Preview Pill */}
          <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>当前水印预览效果：</span>
            </span>

            <div
              className={`text-white transition-all ${
                watermark.font === 'script'
                  ? 'font-script-signature text-base'
                  : watermark.font === 'serif'
                  ? 'font-serif-display text-xs'
                  : watermark.font === 'mono'
                  ? 'font-mono-data text-xs'
                  : 'font-sans text-xs'
              } ${watermark.letterSpacing === 'widest' ? 'tracking-widest' : 'tracking-normal'}`}
              style={{ opacity: watermark.opacity }}
            >
              {watermark.text || 'Photo by Chen Zhi'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
