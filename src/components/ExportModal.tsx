import React, { useState, useEffect, useRef } from 'react';
import { CropState, FrameConfig, PhotoMetadata } from '../types';
import { renderFramedPhotoToCanvas } from '../utils/canvasRenderer';
import { X, Download, Copy, Check, Sparkles, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageElement: HTMLImageElement | null;
  cropState: CropState;
  frameConfig: FrameConfig;
  metadata: PhotoMetadata;
}

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

  useEffect(() => {
    if (!isOpen || !imageElement) return;

    let isCancelled = false;
    setIsRendering(true);

    renderFramedPhotoToCanvas({
      image: imageElement,
      cropState,
      frameConfig,
      metadata,
      scale: scaleFactor,
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
  }, [isOpen, imageElement, cropState, frameConfig, metadata, scaleFactor, format]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const safeModel = (metadata.model || 'photo').replace(/\s+/g, '_');
    const safeRatio = cropState.ratioId;
    link.download = `LuminaFrame_${safeModel}_${safeRatio}_${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
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
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
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

          {/* Render Preview Frame */}
          <div className="relative min-h-[260px] sm:min-h-[360px] flex items-center justify-center bg-black/60 rounded-xl border border-zinc-800 p-4 overflow-hidden">
            {isRendering ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                <span className="text-xs">正在以高精度矢量引擎渲染相框...</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Rendered result"
                className="max-h-[55vh] max-w-full object-contain rounded shadow-2xl"
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
