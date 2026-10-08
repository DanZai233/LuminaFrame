import React from 'react';
import { Upload, Download } from 'lucide-react';

export type WorkspaceTab = 'crop' | 'film' | 'frame' | 'exif';

interface HeaderProps {
  onUploadClick: () => void;
  onExportClick: () => void;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  currentRatioLabel: string;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'crop', label: '画幅裁切' },
  { id: 'film', label: '胶片预设' },
  { id: 'frame', label: '相框与水印' },
  { id: 'exif', label: 'EXIF 元数据' },
];

export const Header: React.FC<HeaderProps> = ({
  onUploadClick,
  onExportClick,
  activeTab,
  setActiveTab,
  currentRatioLabel,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#0b0c0e]/92 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-3 sm:px-5 lg:px-8">
        {/* Brand */}
        <a
          href="/"
          className="flex shrink-0 items-center gap-2 text-white transition-colors hover:text-amber-400"
          title="光影相框 Lumina Frame"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
          <span className="font-serif-display text-base tracking-widest sm:text-lg">光影相框</span>
          <span className="hidden text-[11px] font-normal tracking-normal text-zinc-500 xl:inline">
            Lumina Frame &amp; EXIF Studio
          </span>
        </a>

        {/* Desktop navigation — on small screens the control panel owns the tabs */}
        <nav className="mx-auto hidden items-center gap-1 rounded-lg border border-zinc-800/80 bg-zinc-900/90 p-1 text-xs font-medium lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 font-semibold text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Current ratio indicator */}
        <span className="ml-auto hidden shrink-0 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400/90 md:inline-flex lg:ml-0">
          {currentRatioLabel}
        </span>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <button
            type="button"
            onClick={onUploadClick}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
            title="选择本地照片，自动提取 EXIF 并裁切"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">上传照片</span>
          </button>

          <button
            type="button"
            onClick={onExportClick}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm shadow-amber-500/20 transition-all hover:bg-amber-300 active:scale-95 cursor-pointer sm:px-4"
            title="高分辨率导出相框图片"
          >
            <Download className="h-3.5 w-3.5" />
            <span>导出</span>
          </button>
        </div>
      </div>
    </header>
  );
};
