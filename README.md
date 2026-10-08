<div align="center">

# 光影相框 · Lumina Frame &amp; EXIF Studio

**在浏览器里完成「画幅裁切 → 胶片调色 → 相框排版 → 高清导出」的一站式照片装裱工作台。**

哈苏 XPan 65:24 传奇宽幅 · 真实 EXIF 元数据提取 · 9 款胶卷模拟 · 8 套相框套件 · 最高 4K 无损导出

照片**全程留在你的设备上**：没有服务端、没有上传、没有 AI 接口调用，所有解析与渲染都在浏览器内完成。

</div>

---

## ✨ 功能特性

### 1. 画幅裁切（Crop）
- **12 种经典画幅比例**：XPAN 65:24（哈苏传奇宽幅 ≈2.71:1）、2.39:1 变形宽银幕、16:9、3:2、4:3、1:1、4:5、6:7、2:3、3:4、9:16，以及跟随原图的「原图」比例。
- **自由构图**：在预览图上按住拖拽即可平移取景框，拖拽灵敏度随预览尺寸与缩放倍率自动换算，手感一致。
- **精密微调**：方向键盘精确步进 6%、一键贴边/居中、1.00×–2.50× 缩放、顺/逆时针 90° 旋转、水平镜像。
- **构图辅助**：九宫格参考线（快捷键 `G`），一键全部重置。

### 2. 胶片预设（Film）
9 款可调强度的胶卷/机身色彩模拟，每款都带独立的颗粒感（grain）参数，可选择同步写入 EXIF 的「胶片模拟」字段：

`原片直出` · `Kodak Portra 400` · `Fuji Classic Chrome` · `Fuji Velvia 50` · `Leica M Monochrom` · `Kodak Tri-X 400` · `CineStill 800T` · `Ilford HP5 Plus` · `Kodak Gold 200`

### 3. 相框与水印（Frame）
- **8 套相框套件**：XPAN 电影底片（含上下齿孔与 `HASSELBLAD XPAN · 24×65mm PANORAMA` 印字）、美术馆白卡装裱、黑曜石暗房亚光、徕卡质感红标、富士胶片色卡、复古即显拍立得、极简悬浮下栏等。
- **可调项**：画框底色（含 6 组预设色板）、4 档留白（无边框/紧凑/适中/大画廊）、圆角、内描边、投影、相机品牌 Logo、从照片实时提取的 5 色调色板。
- **水印签名**：自定义文字、左右位置、手写体/衬线/等宽字体、字号、透明度与字距，可与 EXIF 中的摄影师字段联动。

### 4. EXIF 元数据（Metadata）
- **纯前端解析**：由 `exifr` 直接读取 JPEG/HEIC 等文件中的 TIFF / EXIF 标签，提取厂商、机型、镜头、焦段、光圈、快门、ISO、曝光补偿、拍摄时间与地理位置。
- **自动配色板**：读取图像像素并提取 5 色主色调，直接用于相框底部的色彩条。
- **全部字段可手改**：识别有误或想给扫描件补参数时，任意字段都能直接编辑。

### 5. 高清导出
- **3 档倍率**：1X 标准（1080p 社交分享）、2X 高清（2K/3K 精细保真）、3X 超清大师（4K 印刷级）。
- **2 种格式**：PNG 无损（文字最锐利）、JPG 高品质（体积友好）。
- 由 `src/utils/canvasRenderer.ts` 以矢量方式重绘相框、齿孔与排版文字，导出结果与预览一致。

### 6. 效率细节
- 键盘快捷键：`1`/`2`/`3`/`4` 切换右侧面板，`G` 切换九宫格，`Esc` 关闭导出弹窗。
- 4 张精选样片一键载入（缩略图使用 WebP 派生图，约 4–19 KB/张，不阻塞首屏）。
- 上传后自动读取 EXIF 并推断相机品牌 Logo；Toast 提示解析结果。
- 深色影棚界面，左预览 + 右控制台双栏工作台，宽屏下预览区自动吸顶跟随。

---

## 🚀 快速开始

环境要求：**Node.js ≥ 20**（本项目在 Node 22 下开发验证）。

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:3000）
npm run dev

# 3. 生产构建，产物输出到 dist/
npm run build

# 4. 本地预览生产构建
npm run preview

# 5. 类型检查（无输出即通过）
npm run lint
```

> 仓库使用 **npm** 作为包管理器（保留 `package-lock.json`）。如需改用其他包管理器，请先删除对应锁文件再安装，避免锁文件漂移。

---

## 🧱 技术栈

| 领域 | 选型 |
| --- | --- |
| 构建 | Vite 8 |
| UI | React 19 + TypeScript |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite` 插件，无 `tailwind.config.js`） |
| 图标 | lucide-react |
| EXIF 解析 | exifr |
| 导出渲染 | 原生 Canvas 2D（`src/utils/canvasRenderer.ts`） |
| 字体 | Google Fonts：Cinzel / Caveat / JetBrains Mono / Plus Jakarta Sans |

**没有任何服务端代码，也没有对外部 AI 服务的依赖**，构建产物是纯静态文件。

---

## 📁 目录结构

```
LuminaFrame/
├── index.html                     # 入口 HTML（含字体与 SEO meta）
├── metadata.json                  # 应用元信息
├── vite.config.ts                 # Vite 配置（React + Tailwind v4 插件）
├── package.json / package-lock.json
└── src/
    ├── main.tsx                   # React 挂载入口
    ├── App.tsx                    # 工作台布局：预览舞台 + 四面板控制台
    ├── index.css                  # Tailwind 入口与字体/动画工具类
    ├── types/index.ts             # CropState / FrameConfig / PhotoMetadata 等类型
    ├── assets/
    │   ├── images.ts              # 样片静态 import 出口（见下方“静态资源”说明）
    │   └── images/                # 4 张样片原图 + thumbs/ WebP 缩略图
    ├── components/
    │   ├── Header.tsx             # 顶栏：品牌、桌面导航、上传/导出
    │   ├── FramePreview.tsx       # 预览舞台：拖拽取景、齿孔、水印、九宫格
    │   ├── RatioSelector.tsx      # 画幅比例选择
    │   ├── CropControls.tsx       # 构图定位、旋转镜像、参考线
    │   ├── FilmPresetSelector.tsx # 胶卷模拟选择与强度/颗粒
    │   ├── FrameStylePicker.tsx   # 相框套件、底色、留白与显示开关
    │   ├── WatermarkEditor.tsx    # 水印签名编辑
    │   ├── MetadataEditor.tsx     # EXIF 字段编辑与品牌选择
    │   ├── ColorPaletteBar.tsx    # 调色板展示条
    │   └── ExportModal.tsx        # 倍率/格式选择与导出
    └── utils/
        ├── aspectRatios.ts        # 12 种画幅定义
        ├── filmPresets.ts         # 9 款胶卷参数与 CSS 滤镜换算
        ├── brandLogos.tsx         # 相机品牌矢量标识
        ├── colorPalette.ts        # 图像主色提取
        ├── exifParser.ts          # EXIF → PhotoMetadata 映射
        ├── canvasRenderer.ts      # 高分辨率导出渲染引擎
        └── sampleData.ts          # 样片及其默认 EXIF
```

---

## ☁️ 部署到 Vercel

这是一个零配置的静态站点：

1. 在 Vercel 中 **Import Git Repository**，选择本仓库。
2. Framework Preset 选 **Vite**（通常会被自动识别）。
3. Build Command `npm run build`，Output Directory `dist`，无需环境变量。
4. Deploy 即可。之后每次 push 到主分支都会自动重新构建。

---

## ⚠️ 静态资源踩坑记录（图片裂开问题）

**症状**：本地 `npm run dev` 一切正常，部署到 Vercel 后样片缩略图与预览图全部裂开（404）。

**原因**：样片路径曾被写成硬编码字符串：

```ts
// ❌ 错误示范
url: '/src/assets/images/sample_xpan_street_1791190366054.jpg'
```

`/src/...` 只是 Vite **开发服务器**提供的虚拟路径。生产构建时，Vite 只会处理被 `import` 引用的资源并输出到 `dist/assets/` 并加内容哈希，字符串里写死的路径不会进入产物 —— 于是线上直接 404。

**正确做法**：所有随包发布的图片都要经过 `import`，由 `src/assets/images.ts` 统一出口：

```ts
// ✅ 正确示范
import xpanStreetUrl from './images/sample_xpan_street_1791190366054.jpg';

export const SAMPLE_IMAGE_URLS = { xpanStreet: xpanStreetUrl } as const;
```

构建后可在 `dist/assets/` 中看到带哈希的 `sample_*.jpg` / `*.webp`，说明资源已被正确打包。新增样片时请沿用该出口，不要在组件里拼接 `/src/assets/...` 字符串。

---

## 📄 License

Apache-2.0
