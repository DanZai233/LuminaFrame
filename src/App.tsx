/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Header, WorkspaceTab } from './components/Header';
import { FramePreview } from './components/FramePreview';
import { RatioSelector } from './components/RatioSelector';
import { CropControls } from './components/CropControls';
import { MetadataEditor } from './components/MetadataEditor';
import { FrameStylePicker } from './components/FrameStylePicker';
import { WatermarkEditor } from './components/WatermarkEditor';
import { FilmPresetSelector } from './components/FilmPresetSelector';
import { ExportModal } from './components/ExportModal';
import { SAMPLE_PHOTOS, SamplePhoto } from './utils/sampleData';
import { ASPECT_RATIOS } from './utils/aspectRatios';
import { parsePhotoExif } from './utils/exifParser';
import { extractColorPalette } from './utils/colorPalette';
import { computeFilmFilterCss } from './utils/filmPresets';
import { FILM_PRESETS } from './utils/filmPresets';
import { AspectRatioOption, CropState, FrameConfig, PhotoMetadata, FilmFilterConfig } from './types';
import {
  Upload,
  Film,
  Sparkles,
  SlidersHorizontal,
  Image as ImageIcon,
  Camera,
  Check,
  Clapperboard,
  ChevronDown,
  Maximize2,
  Info,
  Palette,
  Scan,
  Layers,
  Crop,
  Frame as FrameIcon,
} from 'lucide-react';

const WORKSPACE_TABS: { id: WorkspaceTab; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'crop', label: '画幅裁切', icon: <SlidersHorizontal className="h-4 w-4" />, hint: '比例、缩放、旋转与构图定位' },
  { id: 'film', label: '胶片预设', icon: <Clapperboard className="h-4 w-4" />, hint: 'Kodak / Fujifilm / Leica 胶卷模拟' },
  { id: 'frame', label: '相框与水印', icon: <Layers className="h-4 w-4" />, hint: '边框套件、留白与签名水印' },
  { id: 'exif', label: 'EXIF 元数据', icon: <ImageIcon className="h-4 w-4" />, hint: '机身镜头与曝光参数编辑' },
];

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Active workspace panel
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('crop');

  // Preview mode. `null` follows the active tab: the crop tab needs the whole
  // photo plus the crop window, every other tab needs the finished frame. A
  // manual pick is dropped as soon as the tab changes so the preview keeps
  // matching the panel you are editing.
  const [previewModeOverride, setPreviewModeOverride] = useState<'crop' | 'result' | null>(null);
  const previewMode: 'crop' | 'result' =
    previewModeOverride ?? (activeTab === 'crop' ? 'crop' : 'result');

  useEffect(() => {
    setPreviewModeOverride(null);
  }, [activeTab]);

  // Active image source
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [currentSampleId, setCurrentSampleId] = useState<string>(SAMPLE_PHOTOS[0].id);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Film Filter Simulation State
  const [filmConfig, setFilmConfig] = useState<FilmFilterConfig>({
    presetId: 'none',
    strength: 85,
    grain: 15,
  });

  // Photo Metadata
  const [metadata, setMetadata] = useState<PhotoMetadata>(SAMPLE_PHOTOS[0].metadata);

  // Crop State
  const [cropState, setCropState] = useState<CropState>({
    ratioId: 'xpan-65-24',
    ratioValue: 65 / 24,
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    flipH: false,
  });

  // Frame Configuration
  const [frameConfig, setFrameConfig] = useState<FrameConfig>({
    styleId: 'xpan-film',
    frameColor: '#0a0a0c',
    textColor: '#ffffff',
    paddingSize: 'medium',
    showMetadata: true,
    showCameraLogo: true,
    showColorPalette: true,
    showFilmPerforations: true,
    showDropShadow: true,
    showInnerBorder: true,
    borderRadius: 8,
    fontStyle: 'mono',
    brandLogo: 'hasselblad',
    paletteColors: ['#1e293b', '#475569', '#f59e0b', '#d97706', '#94a3b8'],
    watermark: {
      enabled: true,
      text: 'Photo by Chen Zhi',
      position: 'right',
      font: 'script',
      opacity: 0.85,
      size: 'md',
      letterSpacing: 'normal',
    },
  });

  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({
    width: 2400,
    height: 1350,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts: 1-4 switch panels, G toggles the composition grid,
  // Escape closes the export dialog.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key >= '1' && e.key <= '4') {
        setActiveTab(WORKSPACE_TABS[Number(e.key) - 1].id);
      } else if (e.key.toLowerCase() === 'g') {
        setShowGrid((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsExportOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When image loads on preview, extract palette & dimensions
  const handleImageLoaded = useCallback((img: HTMLImageElement) => {
    loadedImageRef.current = img;
    setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    const colors = extractColorPalette(img, 5);
    setFrameConfig((prev) => ({
      ...prev,
      paletteColors: colors,
    }));
  }, []);

  // Handle User File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow re-selecting the very same file later on.
    e.target.value = '';

    try {
      showToast('正在解析照片并自动提取 EXIF 元数据...');
      const objectUrl = URL.createObjectURL(file);
      setImageSrc(objectUrl);
      setCurrentSampleId('');
      setIsCustomUpload(true);

      // Parse EXIF
      const { metadata: parsedMeta, brandId } = await parsePhotoExif(file);
      setMetadata(parsedMeta);
      setFrameConfig((prev) => ({
        ...prev,
        brandLogo: brandId,
      }));

      // Reset crop offset
      setCropState((prev) => ({
        ...prev,
        offsetX: 0,
        offsetY: 0,
        zoom: 1.0,
      }));

      showToast(`已成功识别相机：${parsedMeta.make} ${parsedMeta.model}`);
    } catch (err) {
      console.error('File parsing error', err);
      showToast('照片载入完成');
    }
  };

  // Switch Sample Photo
  const handleSelectSample = (sample: SamplePhoto) => {
    setImageSrc(sample.url);
    setCurrentSampleId(sample.id);
    setIsCustomUpload(false);
    setMetadata(sample.metadata);

    const ratioOpt = ASPECT_RATIOS.find((r) => r.id === sample.defaultRatio) || ASPECT_RATIOS[0];
    setCropState({
      ratioId: ratioOpt.id,
      ratioValue: ratioOpt.value,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      flipH: false,
    });

    setFrameConfig((prev) => ({
      ...prev,
      styleId: sample.defaultStyle as FrameConfig['styleId'],
      frameColor: sample.defaultStyle === 'xpan-film' ? '#0a0a0c' : sample.defaultStyle === 'darkroom-matte' ? '#121215' : '#ffffff',
      showFilmPerforations: sample.defaultStyle === 'xpan-film',
      brandLogo: sample.brandId,
    }));

    showToast(`已加载示例照片：${sample.name}`);
  };

  // Select Aspect Ratio
  const handleSelectRatio = (ratioOpt: AspectRatioOption) => {
    let targetVal = ratioOpt.value;
    if (ratioOpt.id === 'original' && originalDimensions.width && originalDimensions.height) {
      targetVal = originalDimensions.width / originalDimensions.height;
    }

    setCropState((prev) => ({
      ...prev,
      ratioId: ratioOpt.id,
      ratioValue: targetVal,
      offsetX: 0,
      offsetY: 0,
    }));

    // If selecting XPan, suggest XPan film frame if current is plain
    if (ratioOpt.id === 'xpan-65-24' && frameConfig.styleId !== 'xpan-film') {
      setFrameConfig((prev) => ({
        ...prev,
        styleId: 'xpan-film',
        frameColor: '#0a0a0c',
        showFilmPerforations: true,
      }));
    }
  };

  const currentRatioOption = ASPECT_RATIOS.find((r) => r.id === cropState.ratioId) || ASPECT_RATIOS[0];
  const isXPan = cropState.ratioId === 'xpan-65-24';
  const activeFilmPreset = useMemo(
    () => FILM_PRESETS.find((p) => p.id === filmConfig.presetId),
    [filmConfig.presetId],
  );
  const activeTabMeta = WORKSPACE_TABS.find((t) => t.id === activeTab) || WORKSPACE_TABS[0];

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#0b0c0e] font-sans text-slate-100">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/png,image/webp,image/tiff,image/heic"
        className="hidden"
      />

      <Header
        onUploadClick={() => fileInputRef.current?.click()}
        onExportClick={() => setIsExportOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRatioLabel={currentRatioOption.label}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 pb-14 pt-4 sm:px-5 lg:px-8">
        {/* Sample Photo Rail */}
        <section className="mb-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-2.5 sm:p-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex shrink-0 items-center gap-2 px-1 text-xs text-zinc-400">
              <Camera className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="font-semibold text-zinc-300">精选原片</span>
              <span className="hidden text-zinc-500 md:inline">· 点击即可载入试用</span>
            </div>

            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SAMPLE_PHOTOS.map((sp) => {
                const isSelected = currentSampleId === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSelectSample(sp)}
                    title={sp.name}
                    className={`group relative flex shrink-0 items-center gap-2 rounded-xl border p-1.5 pr-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400/80 bg-amber-400/10'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <span className="relative block h-10 w-14 overflow-hidden rounded-lg bg-zinc-800">
                      <img
                        src={sp.thumbUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center bg-zinc-950/45">
                          <Check className="h-4 w-4 text-amber-400" />
                        </span>
                      )}
                    </span>
                    <span className="hidden min-w-0 flex-col sm:flex">
                      <span
                        className={`truncate text-[11px] font-semibold ${
                          isSelected ? 'text-amber-300' : 'text-zinc-300'
                        }`}
                      >
                        {sp.name}
                      </span>
                      <span className="truncate text-[10px] text-zinc-500">{sp.category}</span>
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex shrink-0 items-center gap-2 rounded-xl border p-1.5 pr-3 text-left transition-all cursor-pointer ${
                  isCustomUpload
                    ? 'border-amber-400/80 bg-amber-400/10'
                    : 'border-dashed border-zinc-700 bg-zinc-950/60 hover:border-amber-500/50 hover:bg-zinc-900'
                }`}
              >
                <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-zinc-800/80">
                  <Upload className="h-4 w-4 text-amber-400" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] font-semibold text-zinc-200">
                    {isCustomUpload ? '已载入本地照片' : '上传照片'}
                  </span>
                  <span className="text-[10px] text-zinc-500">自动读取 EXIF</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Workbench: preview stage + tabbed control panel */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)] xl:grid-cols-[minmax(0,1.45fr)_minmax(400px,1fr)]">
          {/* ── Left: Preview Stage ───────────────────────────── */}
          <section className="min-w-0 lg:sticky lg:top-[4.5rem] lg:self-start">
            <div
              data-preview-stage
              className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#07080a] shadow-2xl shadow-black/50"
            >
              {/* Stage status bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/70 px-3 py-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-900/80 px-2 py-0.5 font-mono text-amber-400">
                    <Scan className="h-3 w-3" />
                    {currentRatioOption.label}
                    <span className="text-zinc-500">· {currentRatioOption.ratioName}</span>
                  </span>
                  <span className="hidden font-mono text-zinc-500 sm:inline">
                    {originalDimensions.width} × {originalDimensions.height} px
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <div className="flex items-center rounded-md border border-zinc-700/60 bg-zinc-900/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewModeOverride('crop')}
                      title="显示整张照片与可拖动的取景框"
                      className={`flex items-center gap-1 rounded px-2 py-0.5 transition-colors cursor-pointer ${
                        previewMode === 'crop'
                          ? 'bg-amber-400/15 text-amber-300'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Crop className="h-3 w-3" />
                      裁切取景
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewModeOverride('result')}
                      title="显示与导出结果一致的成品相框"
                      className={`flex items-center gap-1 rounded px-2 py-0.5 transition-colors cursor-pointer ${
                        previewMode === 'result'
                          ? 'bg-amber-400/15 text-amber-300'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <FrameIcon className="h-3 w-3" />
                      成品预览
                    </button>
                  </div>
                  {activeFilmPreset && activeFilmPreset.id !== 'none' && (
                    <span
                      className="hidden items-center gap-1 rounded-md px-2 py-0.5 font-medium sm:flex"
                      style={{
                        backgroundColor: `${activeFilmPreset.badgeColor}1f`,
                        color: activeFilmPreset.badgeColor,
                      }}
                    >
                      <Film className="h-3 w-3" />
                      {activeFilmPreset.name}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowGrid((prev) => !prev)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-0.5 transition-colors cursor-pointer ${
                      showGrid
                        ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                        : 'border-zinc-700/60 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="切换九宫格构图辅助线 (G)"
                  >
                    <Maximize2 className="h-3 w-3" />
                    九宫格
                  </button>
                </div>
              </div>

              {/* The frame itself */}
              <div className="relative px-2.5 py-5 sm:px-5 sm:py-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(56,56,64,0.28)_0%,transparent_72%)]" />
                <div className="relative">
                  <FramePreview
                    imageSrc={imageSrc}
                    cropState={cropState}
                    frameConfig={frameConfig}
                    metadata={metadata}
                    showGrid={showGrid}
                    onUpdateOffset={(offsetX, offsetY) => {
                      setCropState((prev) => ({ ...prev, offsetX, offsetY }));
                    }}
                    onUpdateCrop={(next) => {
                      setCropState((prev) => ({ ...prev, ...next }));
                    }}
                    onImageLoaded={handleImageLoaded}
                    filmFilterCss={computeFilmFilterCss(filmConfig)}
                    filmGrain={filmConfig.grain}
                    mode={previewMode}
                  />
                </div>
              </div>

              {/* Quick zoom strip — the most-used crop control, kept beside the preview */}
              <div className="flex items-center gap-3 border-t border-zinc-800/70 px-3 py-2.5">
                <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-zinc-400">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                  缩放
                </span>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.02"
                  value={cropState.zoom}
                  onChange={(e) => {
                    const z = parseFloat(e.target.value);
                    setCropState((prev) => ({ ...prev, zoom: z }));
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-amber-400"
                  aria-label="缩放取景倍率"
                />
                <span className="w-11 shrink-0 text-right font-mono text-[11px] text-zinc-300">
                  {cropState.zoom.toFixed(2)}x
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCropState((prev) => ({ ...prev, zoom: 1.0, offsetX: 0, offsetY: 0, rotation: 0, flipH: false }))
                  }
                  className="shrink-0 rounded-md border border-zinc-700/60 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-100 cursor-pointer"
                >
                  重置
                </button>
              </div>
            </div>

            <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-zinc-500">
              <Info className="h-3 w-3 shrink-0" />
              在预览图上按住拖拽即可自由调整取景位置
              <span className="hidden font-mono text-zinc-600 sm:inline">
                · 偏移 X {Math.round(cropState.offsetX)}% / Y {Math.round(cropState.offsetY)}%
              </span>
            </p>
          </section>

          {/* ── Right: Control Panel ──────────────────────────── */}
          <section className="flex min-w-0 flex-col gap-3">
            {/* Panel tabs */}
            <nav className="grid grid-cols-4 gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-1">
              {WORKSPACE_TABS.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    title={`${tab.hint} (快捷键 ${index + 1})`}
                    className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium transition-all cursor-pointer sm:flex-row sm:justify-center sm:gap-1.5 sm:text-xs ${
                      isActive
                        ? 'bg-zinc-800 text-amber-400 shadow-sm ring-1 ring-amber-400/20'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Active panel */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 sm:p-5">
              <div className="mb-4 border-b border-zinc-800 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="text-amber-400">{activeTabMeta.icon}</span>
                  {activeTabMeta.label}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">{activeTabMeta.hint}</p>
              </div>

              {activeTab === 'crop' && (
                <div className="space-y-4">
                  <CropControls
                    cropState={cropState}
                    onChangeCrop={(updater) => setCropState(updater)}
                    showGrid={showGrid}
                    setShowGrid={setShowGrid}
                    onResetCrop={() =>
                      setCropState((prev) => ({ ...prev, offsetX: 0, offsetY: 0, zoom: 1.0, rotation: 0, flipH: false }))
                    }
                    isWideCrop={cropState.ratioValue >= 1.5}
                  />

                  <RatioSelector
                    currentRatioId={cropState.ratioId}
                    onSelectRatio={handleSelectRatio}
                    originalDimensions={originalDimensions}
                  />
                </div>
              )}

              {activeTab === 'film' && (
                <FilmPresetSelector
                  filmConfig={filmConfig}
                  onChangeFilmConfig={setFilmConfig}
                  onSyncToMetadata={(filmName) => {
                    setMetadata((prev) => ({ ...prev, filmSimulation: filmName }));
                    showToast(`已将底片模拟「${filmName}」同步至 EXIF 标签`);
                  }}
                />
              )}

              {activeTab === 'frame' && (
                <div className="space-y-4">
                  <FrameStylePicker
                    frameConfig={frameConfig}
                    onChangeConfig={(updater) => setFrameConfig(updater)}
                    isXPanRatio={isXPan}
                  />

                  <WatermarkEditor
                    watermark={frameConfig.watermark}
                    onChangeWatermark={(updater) =>
                      setFrameConfig((prev) => ({
                        ...prev,
                        watermark: updater(prev.watermark),
                      }))
                    }
                    photographerName={metadata.photographer}
                  />
                </div>
              )}

              {activeTab === 'exif' && (
                <MetadataEditor
                  metadata={metadata}
                  onChangeMetadata={(updated) => setMetadata((prev) => ({ ...prev, ...updated }))}
                  onSetBrand={(brandId) => setFrameConfig((prev) => ({ ...prev, brandLogo: brandId }))}
                  currentBrandId={frameConfig.brandLogo}
                />
              )}
            </div>

            {/* Contextual summary card */}
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/30 px-3.5 py-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                <Palette className="h-3.5 w-3.5 text-amber-400" />
                当前作品配置
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-zinc-500">画幅比例</dt>
                  <dd className="truncate font-mono text-zinc-300">{currentRatioOption.label}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-zinc-500">相框风格</dt>
                  <dd className="truncate font-mono text-zinc-300">{frameConfig.styleId}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-zinc-500">胶卷模拟</dt>
                  <dd className="truncate font-mono text-zinc-300">{activeFilmPreset?.name || 'Original'}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-zinc-500">水印签名</dt>
                  <dd className="truncate font-mono text-zinc-300">
                    {frameConfig.watermark.enabled ? '已开启' : '已关闭'}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        {/* Educational / help section (collapsed by default to keep the workbench tidy) */}
        <section className="mt-8 border-t border-zinc-800/80 pt-5">
          <button
            type="button"
            onClick={() => setIsHelpOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              关于 XPAN 宽幅、EXIF 提取与高清导出
            </span>
            <ChevronDown
              className={`h-4 w-4 text-zinc-500 transition-transform ${isHelpOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isHelpOpen && (
            <div className="mt-4 grid animate-fade-in grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Film className="h-3.5 w-3.5" />
                  <span>为什么选择 XPAN 65:24 宽幅？</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  哈苏 XPan（富士 TX-1）在 35mm 胶片上曝光出 24×65mm 画幅，宽高比约 2.71:1。它赋予构图强烈的横向空间流动感与电影镜头语境，极适合城市街头、建筑与壮丽风光。
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>自动提取真实 EXIF 参数</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  纯浏览器端解析照片的 TIFF 与 EXIF 标签，提取相机制造商、机型、镜头焦段、光圈快门 ISO 及拍摄时间。照片不会离开你的设备，隐私与响应速度都有保障。
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>高解析度 Master 画质导出</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  内置 Canvas 矢量字体与齿孔绘制引擎，支持 1X（1080p 分享）、2X（2K/3K 精细）到 3X（4K 印刷级）高分辨率导出，无损保存每一处排版细节。
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="animate-fade-in fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-amber-400/40 bg-zinc-900/95 px-4 py-2.5 text-xs text-white shadow-xl shadow-black/50 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        imageElement={loadedImageRef.current}
        cropState={cropState}
        frameConfig={frameConfig}
        metadata={metadata}
        filmConfig={filmConfig}
      />
    </div>
  );
}
