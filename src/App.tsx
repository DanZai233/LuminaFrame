/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
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
import { AspectRatioOption, CropState, FrameConfig, PhotoMetadata, FilmFilterConfig } from './types';
import { Upload, Film, Sparkles, SlidersHorizontal, Image as ImageIcon, Camera, Check, Clapperboard } from 'lucide-react';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Active workspace tab: 'crop' | 'film' | 'frame' | 'exif'
  const [activeTab, setActiveTab] = useState<'crop' | 'film' | 'frame' | 'exif'>('crop');

  // Active image source
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [currentSampleId, setCurrentSampleId] = useState<string>(SAMPLE_PHOTOS[0].id);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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

    try {
      showToast('正在解析照片并自动提取 EXIF 元数据...');
      const objectUrl = URL.createObjectURL(file);
      setImageSrc(objectUrl);
      setCurrentSampleId('');

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
      styleId: sample.defaultStyle as any,
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

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-slate-100 flex flex-col font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/png,image/webp,image/tiff,image/heic"
        className="hidden"
      />

      {/* Top Bar Contract compliant Navigation Header */}
      <Header
        onUploadClick={() => fileInputRef.current?.click()}
        onExportClick={() => setIsExportOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRatioLabel={currentRatioOption.label}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 space-y-6">
        {/* Sample Photos Gallery Strip */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Camera className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-zinc-300">快速试用精选原片：</span>
            <span className="text-zinc-500 hidden md:inline">体验哈苏XPan宽幅、中画幅风光与徕卡人文色彩</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {SAMPLE_PHOTOS.map((sp) => {
              const isSelected = currentSampleId === sp.id;
              return (
                <button
                  key={sp.id}
                  onClick={() => handleSelectSample(sp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-xs'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-zinc-950" />}
                  <span>{sp.name}</span>
                </button>
              );
            })}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>上传您的照片</span>
            </button>
          </div>
        </section>

        {/* Central Visual Stage: Frame Preview */}
        <section className="w-full">
          <FramePreview
            imageSrc={imageSrc}
            cropState={cropState}
            frameConfig={frameConfig}
            metadata={metadata}
            showGrid={showGrid}
            onUpdateOffset={(offsetX, offsetY) => {
              setCropState((prev) => ({ ...prev, offsetX, offsetY }));
            }}
            onImageLoaded={handleImageLoaded}
            filmFilterCss={computeFilmFilterCss(filmConfig)}
            filmGrain={filmConfig.grain}
          />
        </section>

        {/* Crop Micro-Adjustment Bar (Always accessible right below stage) */}
        <section>
          <CropControls
            cropState={cropState}
            onChangeCrop={(updater) => setCropState(updater)}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            onResetCrop={() => setCropState((prev) => ({ ...prev, offsetX: 0, offsetY: 0, zoom: 1.0 }))}
            isWideCrop={cropState.ratioValue >= 1.5}
          />
        </section>

        {/* Tab Content Panels */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 space-y-4">
          {activeTab === 'crop' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-amber-400" />
                    <span>照片比例转换与专业画幅构图</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    特别提供 65:24 宽幅全景（Hasselblad XPan），以及电影变形宽屏、经典全画幅、哈苏方幅等全套规格
                  </p>
                </div>
              </div>

              <RatioSelector
                currentRatioId={cropState.ratioId}
                onSelectRatio={handleSelectRatio}
                originalDimensions={originalDimensions}
              />
            </div>
          )}

          {activeTab === 'film' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-amber-400" />
                    <span>经典胶卷模拟滤镜 (Film Simulation)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    精选 Kodak Portra 暖调人像、Fujifilm 经典正片与反转、Leica 黑白高反差颗粒及 CineStill 电影色调
                  </p>
                </div>
              </div>

              <FilmPresetSelector
                filmConfig={filmConfig}
                onChangeFilmConfig={setFilmConfig}
                onSyncToMetadata={(filmName) => {
                  setMetadata((prev) => ({ ...prev, filmSimulation: filmName }));
                  showToast(`已将底片模拟「${filmName}」同步至 EXIF 标签`);
                }}
              />
            </div>
          )}

          {activeTab === 'frame' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>相框风格套件与装裱设计</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    从经典35mm电影胶卷齿孔底片、现代美术馆白框到徕卡红标签名卡，自由定制光影相框细节
                  </p>
                </div>
              </div>

              <FrameStylePicker
                frameConfig={frameConfig}
                onChangeConfig={(updater) => setFrameConfig(updater)}
                isXPanRatio={isXPan}
              />

              {/* Watermark Signature Settings */}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>相机参数与 EXIF 元数据</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    上传照片已自动提取机身、镜头、曝光三要素；支持手动微调或一键套用大师相机预设
                  </p>
                </div>
              </div>

              <MetadataEditor
                metadata={metadata}
                onChangeMetadata={(updated) => setMetadata((prev) => ({ ...prev, ...updated }))}
                onSetBrand={(brandId) => setFrameConfig((prev) => ({ ...prev, brandLogo: brandId }))}
                currentBrandId={frameConfig.brandLogo}
              />
            </div>
          )}
        </section>

        {/* Educational Section on XPan and Framing */}
        <section className="border-t border-zinc-800/80 pt-6 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                <span>为什么选择 XPAN 65:24 宽幅？</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                哈苏XPan（富士TX-1）在35mm胶片上曝光出24×65mm画幅，宽高比约为2.71:1。区别于普通照片，它赋予构图强烈的横向空间流动感与电影镜头语境，极适合城市街头、建筑与壮丽风光。
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>自动提取真实 EXIF 参数</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                纯浏览器端原生解析照片的TIFF与EXIF标签，提取相机制造商品牌、机型、镜头焦段、光圈快门ISO及拍摄时间，无需后端上传即可保障隐私与秒级响应。
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>高解析度 Master 画质导出</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                内置 Canvas 矢量字体与微米级齿孔绘制引擎，支持 1X（1080p 分享）、2X（2K/3K 精细）到 3X（4K 印刷级）高分辨率导出，无损保存每一处排版细节。
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-amber-400/40 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl shadow-black/50 backdrop-blur-md flex items-center gap-2 animate-bounce-short">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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
