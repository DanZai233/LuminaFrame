import exifr from 'exifr';
import { PhotoMetadata } from '../types';

export function detectBrandId(make?: string, model?: string): string {
  const text = `${make || ''} ${model || ''}`.toLowerCase();
  if (text.includes('hasselblad') || text.includes('xpan')) return 'hasselblad';
  if (text.includes('leica')) return 'leica';
  if (text.includes('fujifilm') || text.includes('fuji')) return 'fujifilm';
  if (text.includes('sony')) return 'sony';
  if (text.includes('canon')) return 'canon';
  if (text.includes('nikon')) return 'nikon';
  if (text.includes('apple') || text.includes('iphone')) return 'apple';
  if (text.includes('ricoh') || text.includes('gr')) return 'ricoh';
  if (text.includes('zeiss')) return 'zeiss';
  if (text.includes('panasonic') || text.includes('lumix')) return 'lumix';
  return 'none';
}

function cleanCameraMake(make?: string): string {
  if (!make) return 'HASSELBLAD';
  let m = make.trim();
  if (m.toUpperCase().includes('LEICA')) return 'LEICA';
  if (m.toUpperCase().includes('FUJIFILM')) return 'FUJIFILM';
  if (m.toUpperCase().includes('HASSELBLAD')) return 'HASSELBLAD';
  if (m.toUpperCase().includes('SONY')) return 'SONY';
  if (m.toUpperCase().includes('CANON')) return 'CANON';
  if (m.toUpperCase().includes('NIKON')) return 'NIKON';
  if (m.toUpperCase().includes('APPLE')) return 'APPLE';
  if (m.toUpperCase().includes('RICOH')) return 'RICOH';
  return m.toUpperCase();
}

function cleanCameraModel(model?: string, make?: string): string {
  if (!model) return 'XPAN II';
  let clean = model.trim();
  if (make) {
    const makeUpper = make.toUpperCase();
    if (clean.toUpperCase().startsWith(makeUpper)) {
      clean = clean.substring(makeUpper.length).trim();
    }
  }
  return clean || model;
}

function formatShutterSpeed(seconds?: number): string {
  if (!seconds || seconds <= 0) return '1/250s';
  if (seconds >= 1) {
    return `${Math.round(seconds * 10) / 10}s`;
  }
  const denominator = Math.round(1 / seconds);
  return `1/${denominator}s`;
}

function formatAperture(fNumber?: number): string {
  if (!fNumber) return 'f/4.0';
  return `f/${Number(fNumber.toFixed(1))}`;
}

function formatFocalLength(focalLength?: number): string {
  if (!focalLength) return '45mm';
  return `${Math.round(focalLength)}mm`;
}

function formatIso(iso?: number | number[]): string {
  if (!iso) return '200';
  if (Array.isArray(iso)) return `${iso[0]}`;
  return `${iso}`;
}

function formatDateTime(dateVal?: Date | string | number): string {
  if (!dateVal) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return String(dateVal);
  }
}

function formatGps(lat?: number, lon?: number): string {
  if (lat === undefined || lon === undefined) return '';
  const latRef = lat >= 0 ? 'N' : 'S';
  const lonRef = lon >= 0 ? 'E' : 'W';
  const latDeg = Math.floor(Math.abs(lat));
  const latMin = Math.round((Math.abs(lat) - latDeg) * 60);
  const lonDeg = Math.floor(Math.abs(lon));
  const lonMin = Math.round((Math.abs(lon) - lonDeg) * 60);
  return `${latDeg}°${latMin}'${latRef} ${lonDeg}°${lonMin}'${lonRef}`;
}

export async function parsePhotoExif(fileOrUrl: File | Blob | string): Promise<{
  metadata: PhotoMetadata;
  brandId: string;
}> {
  try {
    const raw = await exifr.parse(fileOrUrl, {
      tiff: true,
      xmp: true,
      icc: false,
      gps: true,
      mergeOutput: true,
    });

    if (!raw) {
      return {
        metadata: getDefaultXpanMetadata(),
        brandId: 'hasselblad',
      };
    }

    const rawMake = raw.Make ? String(raw.Make).trim() : '';
    const rawModel = raw.Model ? String(raw.Model).trim() : '';
    const make = cleanCameraMake(rawMake);
    const model = cleanCameraModel(rawModel, rawMake);
    const lens = raw.LensModel || raw.Lens || (raw.FocalLength ? `${Math.round(raw.FocalLength)}mm Lens` : '45mm F4');
    const focalLength = formatFocalLength(raw.FocalLength);
    const aperture = formatAperture(raw.FNumber);
    const shutterSpeed = formatShutterSpeed(raw.ExposureTime);
    const iso = formatIso(raw.ISO || raw.ISOSpeedRatings);
    const exposureBias = raw.ExposureBiasValue !== undefined ? `${raw.ExposureBiasValue > 0 ? '+' : ''}${Number(raw.ExposureBiasValue).toFixed(1)} EV` : '0 EV';
    const dateTime = formatDateTime(raw.DateTimeOriginal || raw.CreateDate || raw.ModifyDate);
    const gpsLocation = formatGps(raw.latitude, raw.longitude);

    const brandId = detectBrandId(rawMake, rawModel);

    return {
      metadata: {
        make: make || 'HASSELBLAD',
        model: model || 'XPAN II',
        lens: String(lens).trim(),
        focalLength,
        aperture,
        shutterSpeed,
        iso,
        exposureBias,
        dateTime,
        location: gpsLocation || '',
        filmSimulation: 'XPAN 65×24 Panoramic',
        photographer: '',
        aspectNote: 'HASSELBLAD XPAN 24×65mm',
      },
      brandId,
    };
  } catch (err) {
    console.warn('Failed to parse EXIF, using default values', err);
    return {
      metadata: getDefaultXpanMetadata(),
      brandId: 'hasselblad',
    };
  }
}

export function getDefaultXpanMetadata(): PhotoMetadata {
  return {
    make: 'HASSELBLAD',
    model: 'XPAN II',
    lens: 'HASSELBLAD 45mm F4',
    focalLength: '45mm',
    aperture: 'f/4.0',
    shutterSpeed: '1/250s',
    iso: '200',
    exposureBias: '0 EV',
    dateTime: '2026.04.18  17:42:09',
    location: '35°41\'N 139°42\'E',
    filmSimulation: 'XPAN 24×65mm Panorama',
    photographer: 'Lumina Studio',
    aspectNote: 'HASSELBLAD XPAN 24×65mm',
  };
}
