import React from 'react';
import { CropState } from '../types';
import {
  ZoomIn,
  RotateCw,
  FlipHorizontal,
  RotateCcw,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Grid,
} from 'lucide-react';

interface CropControlsProps {
  cropState: CropState;
  onChangeCrop: (updater: (prev: CropState) => CropState) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean | ((prev: boolean) => boolean)) => void;
  onResetCrop: () => void;
  isWideCrop: boolean;
}

export const CropControls: React.FC<CropControlsProps> = ({
  cropState,
  onChangeCrop,
  showGrid,
  setShowGrid,
  onResetCrop,
  isWideCrop,
}) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-zinc-300 flex items-center gap-1.5">
          <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
          <span>裁切微调与构图位置</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid((prev) => !prev)}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              showGrid
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
            }`}
            title="显示九宫格构图辅助线"
          >
            <Grid className="w-3 h-3" />
            <span>九宫格参考线</span>
          </button>
          <button
            onClick={onResetCrop}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
          >
            重置居中
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {/* Quick Panorama Slice Alignment (Crucial for XPan!) */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>{isWideCrop ? '上下景深取景定位' : '左右取景定位'}</span>
            <span className="text-[10px] text-amber-400 font-mono">
              {isWideCrop ? (cropState.offsetY < -15 ? '偏上取景' : cropState.offsetY > 15 ? '偏下取景' : '中间居中') : '快速定位'}
            </span>
          </label>
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 rounded-lg border border-zinc-800">
            <button
              onClick={() => onChangeCrop((prev) => ({ ...prev, offsetY: isWideCrop ? -45 : prev.offsetY, offsetX: !isWideCrop ? -45 : prev.offsetX }))}
              className="flex-1 py-1 px-2 text-[11px] font-medium rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title={isWideCrop ? '取画面偏上部分' : '取画面偏左'}
            >
              <AlignVerticalJustifyStart className="w-3 h-3" />
              <span>{isWideCrop ? '顶部' : '偏左'}</span>
            </button>
            <button
              onClick={() => onChangeCrop((prev) => ({ ...prev, offsetY: 0, offsetX: 0 }))}
              className="flex-1 py-1 px-2 text-[11px] font-medium rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="水平垂直正中"
            >
              <AlignVerticalJustifyCenter className="w-3 h-3" />
              <span>居中</span>
            </button>
            <button
              onClick={() => onChangeCrop((prev) => ({ ...prev, offsetY: isWideCrop ? 45 : prev.offsetY, offsetX: !isWideCrop ? 45 : prev.offsetX }))}
              className="flex-1 py-1 px-2 text-[11px] font-medium rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title={isWideCrop ? '取画面偏下部分' : '取画面偏右'}
            >
              <AlignVerticalJustifyEnd className="w-3 h-3" />
              <span>{isWideCrop ? '底部' : '偏右'}</span>
            </button>
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>缩放取景倍率</span>
            <span className="font-mono text-zinc-300">{cropState.zoom.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.02"
              value={cropState.zoom}
              onChange={(e) => {
                const z = parseFloat(e.target.value);
                onChangeCrop((prev) => ({ ...prev, zoom: z }));
              }}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Rotation & Flip */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-400">画面旋转与镜像</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onChangeCrop((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
              className="flex-1 py-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="顺时针旋转90度"
            >
              <RotateCw className="w-3 h-3" />
              <span>旋转90°</span>
            </button>
            <button
              onClick={() => onChangeCrop((prev) => ({ ...prev, flipH: !prev.flipH }))}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                cropState.flipH
                  ? 'bg-amber-400 text-zinc-950 font-semibold'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title="水平镜像翻转"
            >
              <FlipHorizontal className="w-3 h-3" />
              <span>水平镜像</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-zinc-500 flex items-center justify-between">
        <span>💡 提示：您可直接在上方预览图中<b>按住鼠标拖拽</b>自由微调构图区域</span>
        <span className="font-mono text-zinc-400">
          偏移: X {Math.round(cropState.offsetX)}% · Y {Math.round(cropState.offsetY)}%
        </span>
      </div>
    </div>
  );
};
