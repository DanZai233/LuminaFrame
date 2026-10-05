import React from 'react';
import { Upload, Download, Sparkles, SlidersHorizontal, Image as ImageIcon, Clapperboard } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  onExportClick: () => void;
  activeTab: 'crop' | 'film' | 'frame' | 'exif';
  setActiveTab: (tab: 'crop' | 'film' | 'frame' | 'exif') => void;
  currentRatioLabel: string;
}

export const Header: React.FC<HeaderProps> = ({
  onUploadClick,
  onExportClick,
  activeTab,
  setActiveTab,
  currentRatioLabel,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0c0e]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a href="/" className="text-base font-bold tracking-tight text-white hover:text-amber-400 transition-colors flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="font-serif-display tracking-widest text-lg">光影相框</span>
            <span className="text-xs font-normal text-zinc-400 tracking-normal hidden sm:inline">Lumina Frame</span>
          </a>
          <span className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-mono hidden md:inline-flex items-center gap-1">
            XPAN 65:24 宽幅支持
          </span>
        </div>

        {/* Zone 2: Navigation Links / Workspace Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('crop')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'crop'
                ? 'bg-zinc-800 text-amber-400 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>画幅裁切</span>
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">({currentRatioLabel})</span>
          </button>
          <button
            onClick={() => setActiveTab('film')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'film'
                ? 'bg-zinc-800 text-amber-400 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>胶片预设</span>
          </button>
          <button
            onClick={() => setActiveTab('frame')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'frame'
                ? 'bg-zinc-800 text-amber-400 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>相框与水印</span>
          </button>
          <button
            onClick={() => setActiveTab('exif')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'exif'
                ? 'bg-zinc-800 text-amber-400 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>EXIF元数据</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onUploadClick}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="选择本地照片提取EXIF并裁切"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">上传照片</span>
            <span className="sm:hidden">上传</span>
          </button>

          <button
            onClick={onExportClick}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm shadow-amber-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
            title="高分辨率导出保存相框图片"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出相框</span>
          </button>
        </div>
      </div>
    </header>
  );
};
