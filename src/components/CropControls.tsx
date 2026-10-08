import React from 'react';
import { CropState } from '../types';
import {
  RotateCw,
  FlipHorizontal,
  RotateCcw,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Grid,
  ArrowLeftRight,
  ArrowUpDown,
  Move,
  Gauge,
} from 'lucide-react';
import { clampTilt, normalizeAngle, rotationTilt, TILT_LIMIT, withRotationTilt } from '../utils/rotation';

/** Tilt slider handle icon (a dial-ish glyph). */
const AngleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Gauge className={`h-3 w-3 shrink-0 ${className ?? ''}`} />
);

interface CropControlsProps {
  cropState: CropState;
  onChangeCrop: (updater: (prev: CropState) => CropState) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean | ((prev: boolean) => boolean)) => void;
  onResetCrop: () => void;
  isWideCrop: boolean;
}

/** A labelled sub-block inside the crop panel. */
const Group: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({
  title,
  hint,
  children,
}) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] font-semibold tracking-wide text-zinc-300">{title}</span>
      {hint && <span className="font-mono text-[10px] text-zinc-500">{hint}</span>}
    </div>
    {children}
  </div>
);

export const CropControls: React.FC<CropControlsProps> = ({
  cropState,
  onChangeCrop,
  showGrid,
  setShowGrid,
  onResetCrop,
  isWideCrop,
}) => {
  const nudge = (axis: 'x' | 'y', delta: number) =>
    onChangeCrop((prev) => ({
      ...prev,
      offsetX: axis === 'x' ? Math.max(-50, Math.min(50, prev.offsetX + delta)) : prev.offsetX,
      offsetY: axis === 'y' ? Math.max(-50, Math.min(50, prev.offsetY + delta)) : prev.offsetY,
    }));

  /** Distance from the nearest right angle, so the slider always reads "tilt". */
  const tilt = clampTilt(rotationTilt(cropState.rotation));

  const nudgeButton =
    'flex h-8 flex-1 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/70 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer';

  return (
    <div className="space-y-4">
      {/* Composition nudging — arrow pad mirrors the on-canvas drag */}
      <Group
        title="构图定位"
        hint={`偏移 X ${Math.round(cropState.offsetX)}% · Y ${Math.round(cropState.offsetY)}%`}
      >
        <div className="flex items-stretch gap-2">
          <div className="flex flex-1 flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => nudge('y', -6)}
              className={nudgeButton}
              title="画面上移 6%"
              aria-label="画面上移"
            >
              <ArrowUpDown className="h-3.5 w-3.5 rotate-180" />
            </button>
            <div className="flex w-full gap-1">
              <button
                type="button"
                onClick={() => nudge('x', -6)}
                className={nudgeButton}
                title="画面左移 6%"
                aria-label="画面左移"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChangeCrop((prev) => ({ ...prev, offsetX: 0, offsetY: 0 }))}
                className="flex h-8 flex-1 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-300 transition-colors hover:bg-amber-400/20 cursor-pointer"
                title="回到正中央"
                aria-label="回到正中央"
              >
                <Move className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge('x', 6)}
                className={nudgeButton}
                title="画面右移 6%"
                aria-label="画面右移"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 rotate-180" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => nudge('y', 6)}
              className={nudgeButton}
              title="画面下移 6%"
              aria-label="画面下移"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex w-[46%] flex-col gap-1.5">
            <button
              type="button"
              onClick={() =>
                onChangeCrop((prev) => ({
                  ...prev,
                  offsetY: isWideCrop ? -45 : 0,
                  offsetX: isWideCrop ? prev.offsetX : -45,
                }))
              }
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/70 px-2 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
            >
              <AlignVerticalJustifyStart className="h-3 w-3" />
              {isWideCrop ? '贴顶部取景' : '贴左侧取景'}
            </button>
            <button
              type="button"
              onClick={() => onChangeCrop((prev) => ({ ...prev, offsetX: 0, offsetY: 0 }))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/70 px-2 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
            >
              <AlignVerticalJustifyCenter className="h-3 w-3" />
              精准居中
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeCrop((prev) => ({
                  ...prev,
                  offsetY: isWideCrop ? 45 : 0,
                  offsetX: isWideCrop ? prev.offsetX : 45,
                }))
              }
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/70 px-2 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
            >
              <AlignVerticalJustifyEnd className="h-3 w-3" />
              {isWideCrop ? '贴底部取景' : '贴右侧取景'}
            </button>
          </div>
        </div>
      </Group>

      {/* Rotation & mirror */}
      <Group
        title="旋转与镜像"
        hint={`${Math.round(normalizeAngle(cropState.rotation) * 10) / 10}°${
          cropState.flipH ? ' · 已镜像' : ''
        }`}
      >
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeCrop((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2 py-2 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
            title="顺时针旋转 90°"
          >
            <RotateCw className="h-3.5 w-3.5" />
            顺时针
          </button>
          <button
            type="button"
            onClick={() => onChangeCrop((prev) => ({ ...prev, rotation: (prev.rotation + 270) % 360 }))}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2 py-2 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
            title="逆时针旋转 90°"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            逆时针
          </button>
          <button
            type="button"
            onClick={() => onChangeCrop((prev) => ({ ...prev, flipH: !prev.flipH }))}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors cursor-pointer ${
              cropState.flipH
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
            title="水平镜像翻转"
          >
            <FlipHorizontal className="h-3.5 w-3.5" />
            镜像
          </button>
        </div>

        {/* Fine tilt, for straightening a crooked horizon */}
        <div className="flex items-center gap-2 pt-1">
          <AngleIcon className={tilt !== 0 ? 'text-amber-400' : 'text-zinc-500'} />
          <input
            type="range"
            min={-TILT_LIMIT}
            max={TILT_LIMIT}
            step={0.1}
            value={tilt}
            onChange={(e) =>
              onChangeCrop((prev) => ({
                ...prev,
                rotation: withRotationTilt(prev.rotation, parseFloat(e.target.value)),
              }))
            }
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-amber-400"
            title={`微调旋转角度（±${TILT_LIMIT}°），用来校正倾斜的地平线`}
            aria-label="倾斜角度"
          />
          <button
            type="button"
            onClick={() => onChangeCrop((prev) => ({ ...prev, rotation: withRotationTilt(prev.rotation, 0) }))}
            disabled={tilt === 0}
            className={`w-14 shrink-0 rounded-md border px-1 py-0.5 text-right font-mono text-[10px] tabular-nums transition-colors ${
              tilt !== 0
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 cursor-pointer hover:border-amber-400/70'
                : 'border-transparent text-zinc-600'
            }`}
            title="点击将倾斜角归零"
          >
            {`${tilt > 0 ? '+' : ''}${tilt.toFixed(1)}°`}
          </button>
        </div>
      </Group>

      {/* Guides & reset */}
      <div className="flex items-center gap-2 border-t border-zinc-800/80 pt-3">
        <button
          type="button"
          onClick={() => setShowGrid((prev) => !prev)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
            showGrid
              ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
              : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
          title="显示九宫格构图辅助线 (快捷键 G)"
        >
          <Grid className="h-3 w-3" />
          九宫格参考线
        </button>
        <button
          type="button"
          onClick={onResetCrop}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          全部重置
        </button>
      </div>
    </div>
  );
};
