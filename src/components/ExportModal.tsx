import React, { useState, useEffect, useRef } from 'react';
import { CropState, FrameConfig, PhotoMetadata } from '../types';
import { renderFramedPhotoToCanvas } from '../utils/canvasRenderer';
import { X, Download, Copy, Check, Sparkles, Loader2, Wand2, SlidersHorizontal, Sun } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageElement: HTMLImageElement | null;
  cropState: CropState;
  frameConfig: FrameConfig;
  metadata: PhotoMetadata;
}

type EnhancePresetId = 'cinematic' | 'fuji' | 'leica' | 'vintage';

interface EnhancePreset {
  id: EnhancePresetId;
  name: string;
  tagline: string;
  contrast: number;
  saturate: number;
  brightness: number;
}

const ENHANCE_PRESETS: EnhancePreset[] = [
  {
    id: 'cinematic',
    name: '35mm 电影光影',
    tagline: '对比度 +14% · 饱和度 +20% · 暗部沉稳有层次',
    contrast: 1.14,
    saturate: 1.20,
    brightness: 1.02,
  },
  {
    id: 'fuji',
    name: '富士鲜活反转',
    tagline: '饱和度 +28% · 色彩通透鲜艳 · 风景街头绝配',
    contrast: 1.10,
    saturate: 1.28,
    brightness: 1.03,
  },
  {
    id: 'leica',
    name: '德系微反差锐化',
    tagline: '对比度 +22% · 强化阴影微对比与立体雕塑感',
    contrast: 1.22,
    saturate: 1.08,
    brightness: 1.01,
  },
  {
    id: 'vintage',
    name: '复古暖调胶片',
    tagline: '暖金微调 · 柔和高光 · 怀旧胶卷印相质感',
    contrast: 1.08,
    saturate: 1.14,
    brightness: 1.03,
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageElement,
  cropState,
  frameConfig,
  metadata,
}) => {
  const [scaleFactor, setScaleFactor] = useState<number>(2);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [exportDimensions, setExportDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Color Enhancement state
  const [colorEnhance, setColorEnhance] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<EnhancePresetId>('cinematic');
  const [contrast, setContrast] = useState<number>(1.14);
  const [saturate, setSaturate] = useState<number>(1.20);
  const [brightness, setBrightness] = useState<number>(1.02);
  const [showFineTune, setShowFineTune] = useState<boolean>(false);

  const handleSelectPreset = (preset: EnhancePreset) => {
    setActivePreset(preset.id);
    setContrast(preset.contrast);
    setSaturate(preset.saturate);
    setBrightness(preset.brightness);
  };

  useEffect(() => {
    if (!isOpen || !imageElement) return;

    let isCancelled = false;
    setIsRendering(true);

    const filterString = colorEnhance
      ? activePreset === 'vintage'
        ? `contrast(${contrast}) saturate(${saturate}) brightness(${brightness}) sepia(0.06)`
        : `contrast(${contrast}) saturate(${saturate}) brightness(${brightness})`
      : undefined;

    renderFramedPhotoToCanvas({
      image: imageElement,
      cropState,
      frameConfig,
      metadata,
      scale: scaleFactor,
      colorEnhance: {
        enabled: colorEnhance,
        contrast,
        saturate,
        brightness,
        filterString,
      },
    })
      .then((canvas) => {
        if (isCancelled) return;
        canvasRef.current = canvas;
        setExportDimensions({ width: canvas.width, height: canvas.height });
        const url = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
        setPreviewUrl(url);
        setIsRendering(false);
      })
      .catch((err) => {
        console.error('Render failed', err);
        setIsRendering(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    imageElement,
    cropState,
    frameConfig,
    metadata,
    scaleFactor,
    format,
    colorEnhance,
    activePreset,
    contrast,
    saturate,
    brightness,
  ]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const safeModel = (metadata.model || 'photo').replace(/\s+/g, '_');
    const safeRatio = cropState.ratioId;
    link.download = `LuminaFrame_${safeModel}_${safeRatio}_${colorEnhance ? 'Enhanced_' : ''}${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
    link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
    link.click();
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch (clipErr) {
          console.warn('Clipboard write failed', clipErr);
        }
      }, 'image/png');
    } catch (e) {
      console.warn('To blob error', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121316] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              高清导出相框成品
            </h3>
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              ({exportDimensions.width} × {exportDimensions.height} px)
            </span>
            {colorEnhance && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium hidden sm:inline-flex items-center gap-1">
                <Wand2 className="w-2.5 h-2.5" /> 已启用光影增强
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. Cinematic Color Enhancement Switch & Filter Panel */}
          <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">电影感光影与色彩质感增强</span>
                <span className="text-[11px] text-zinc-400 hidden md:inline">
                  通过对比度、饱和度与微反差让暗部更深邃、光影更具电影张力
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={colorEnhance}
                  onChange={(e) => setColorEnhance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                <span className="ml-2 text-xs font-semibold text-zinc-200">
                  {colorEnhance ? '已开启' : '关闭增强'}
                </span>
              </label>
            </div>

            {colorEnhance && (
              <div className="space-y-3 pt-2 border-t border-zinc-800/80 animate-fade-in">
                {/* 4 Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ENHANCE_PRESETS.map((p) => {
                    const isSelected = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-zinc-800 text-white shadow-sm ring-1 ring-amber-400/40'
                            : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
                          {p.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1 leading-snug line-clamp-2">
                          {p.tagline}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Fine-Tuning Toggle and Sliders */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowFineTune((prev) => !prev)}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{showFineTune ? '收起微调滑块' : '自定义微调对比度、饱和度与高光'}</span>
                  </button>

                  {showFineTune && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-950/70 rounded-lg border border-zinc-800 animate-fade-in">
                      {/* Contrast Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>对比度 (Contrast)</span>
                          <span className="font-mono text-zinc-200">{Math.round(contrast * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="1.35"
                          step="0.02"
                          value={contrast}
                          onChange={(e) => setContrast(parseFloat(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                        />
                      </div>

                      {/* Saturation Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>色彩饱和度 (Saturation)</span>
                          <span className="font-mono text-zinc-200">{Math.round(saturate * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="1.45"
                          step="0.02"
                          value={saturate}
                          onChange={(e) => setSaturate(parseFloat(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                        />
                      </div>

                      {/* Brightness Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>通透亮度 (Brightness)</span>
                          <span className="font-mono text-zinc-200">{Math.round(brightness * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.95"
                          max="1.1"
                          step="0.01"
                          value={brightness}
                          onChange={(e) => setBrightness(parseFloat(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Controls Bar: Resolution & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>输出分辨率规格</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { factor: 1, label: '1X 标准', desc: '社交分享 1080p' },
                  { factor: 2, label: '2X 高清', desc: '精细保真 2K/3K' },
                  { factor: 3, label: '3X 超清大师', desc: '大画幅 4K 印刷' },
                ].map((opt) => (
                  <button
                    key={opt.factor}
                    onClick={() => setScaleFactor(opt.factor)}
                    className={`py-2 px-2 rounded-lg text-left transition-all cursor-pointer border ${
                      scaleFactor === opt.factor
                        ? 'bg-amber-400/10 border-amber-400 text-white'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`text-xs font-bold ${scaleFactor === opt.factor ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300 font-medium">文件导出格式</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'png', label: 'PNG 无损格式', desc: '边缘最锐利，保留微小参数文字' },
                  { id: 'jpeg', label: 'JPG 高品质', desc: '文件小，色彩平滑适合分享' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id as 'png' | 'jpeg')}
                    className={`p-2 rounded-lg text-left transition-all cursor-pointer border ${
                      format === fmt.id
                        ? 'bg-amber-400/10 border-amber-400 text-white'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`text-xs font-bold ${format === fmt.id ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {fmt.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Render Preview Frame */}
          <div className="relative min-h-[260px] sm:min-h-[340px] flex items-center justify-center bg-black/60 rounded-xl border border-zinc-800 p-4 overflow-hidden">
            {isRendering ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                <span className="text-xs">正在渲染相框与光影增强效果...</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Rendered result"
                className="max-h-[50vh] max-w-full object-contain rounded shadow-2xl"
              />
            ) : null}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>成图规格:</span>
            <span className="font-mono text-zinc-200 font-semibold">
              {exportDimensions.width} × {exportDimensions.height} px
            </span>
            <span className="text-zinc-600">·</span>
            <span className="uppercase text-amber-400 font-mono text-[11px]">{format}</span>
            {colorEnhance && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-amber-400 text-[11px] font-medium">电影感增强</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              disabled={isRendering}
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制到剪贴板' : '复制图片'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isRendering}
              className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>保存图片至相册/电脑</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

