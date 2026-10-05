/**
 * Extract dominant palette colors from an HTMLImageElement
 */
export function extractColorPalette(img: HTMLImageElement, count = 5): string[] {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return ['#2b3a4a', '#8b5a3e', '#d4a373', '#e9edc9', '#ccd5ae'];

    // Downscale for fast sampling
    const width = 64;
    const height = 64;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;

    // Bucket colors in RGB space
    const buckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};
    const step = 4 * 4; // Sample every 4th pixel

    for (let i = 0; i < imageData.length; i += step) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];

      if (a < 128) continue; // Skip transparent

      // Quantize to 32 levels to group similar tones
      const qR = Math.floor(r / 32) * 32;
      const qG = Math.floor(g / 32) * 32;
      const qB = Math.floor(b / 32) * 32;
      const key = `${qR},${qG},${qB}`;

      if (!buckets[key]) {
        buckets[key] = { r, g, b, count: 0 };
      }
      buckets[key].count++;
    }

    const sortedBuckets = Object.values(buckets).sort((a, b) => b.count - a.count);

    if (sortedBuckets.length === 0) {
      return ['#262626', '#52525b', '#a1a1aa', '#e4e4e7', '#f43f5e'];
    }

    // Pick diverse colors
    const colors: string[] = [];
    for (const b of sortedBuckets) {
      const hex = rgbToHex(b.r, b.g, b.b);
      // Check if not too close to already picked colors
      const isTooClose = colors.some(existing => {
        const c1 = hexToRgb(existing);
        const dist = Math.sqrt((b.r - c1.r) ** 2 + (b.g - c1.g) ** 2 + (b.b - c1.b) ** 2);
        return dist < 45;
      });

      if (!isTooClose) {
        colors.push(hex);
      }
      if (colors.length >= count) break;
    }

    while (colors.length < count) {
      colors.push('#71717a');
    }

    return colors;
  } catch (err) {
    console.warn('Could not extract color palette', err);
    return ['#27272a', '#71717a', '#a1a1aa', '#d4d4d8', '#f4f4f5'];
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}
