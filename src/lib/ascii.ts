import type { SegmentMask } from './segment';

export type { SegmentMask };
export type CropRect = { x: number; y: number; w: number; h: number };

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export interface AsciiOptions {
  crop?: CropRect;
  mask?: SegmentMask;
  bw?: boolean;        // default true
  fontWeight?: boolean; // bold dark chars for deeper shadows
}

// Characters at or below this fraction of the range get bold treatment
const BOLD_THRESHOLD = 0.38;

function escapeHtml(c: string): string {
  if (c === '&') return '&amp;';
  if (c === '<') return '&lt;';
  if (c === '>') return '&gt;';
  return c;
}

// Applies mask to canvas pixel data in-place (sets bg pixels transparent)
function applyMask(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mask: SegmentMask,
  scaleX: number,
  scaleY: number,
  offsetX = 0,
  offsetY = 0
) {
  const imgData = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mx = clamp(Math.round(x * scaleX + offsetX), 0, mask.width - 1);
      const my = clamp(Math.round(y * scaleY + offsetY), 0, mask.height - 1);
      if (mask.data[my * mask.width + mx] < 0.5) {
        imgData.data[(y * w + x) * 4 + 3] = 0;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// Returns a PNG data-URL of the preprocessed image for display as a thumbnail
export function buildPreviewUrl(
  image: HTMLImageElement,
  options: { bw: boolean; mask?: SegmentMask | null }
): string {
  const MAX = 240;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.min(1, MAX / Math.max(iw, ih));
  const pw = Math.round(iw * scale);
  const ph = Math.round(ih * scale);

  const canvas = document.createElement('canvas');
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d')!;

  ctx.filter = options.bw ? 'grayscale(1) contrast(1.4) brightness(1.08)' : 'none';
  ctx.drawImage(image, 0, 0, pw, ph);

  if (options.mask) {
    applyMask(ctx, pw, ph, options.mask, 1 / scale, 1 / scale);
  }

  return canvas.toDataURL('image/png');
}

// Returns plain text (fontWeight off) or HTML string with <b> tags (fontWeight on).
// When fontWeight is on, render output with dangerouslySetInnerHTML inside a <pre>.
export function buildAsciiFromImage(
  image: HTMLImageElement,
  width: number,
  charSet: string,
  options?: AsciiOptions
): string {
  const { crop, mask, bw = true, fontWeight = false } = options ?? {};

  const srcX = crop?.x ?? 0;
  const srcY = crop?.y ?? 0;
  const srcW = crop?.w ?? (image.naturalWidth || image.width);
  const srcH = crop?.h ?? (image.naturalHeight || image.height);

  const aspectRatio = srcH / srcW;
  const height = Math.max(10, Math.round(width * aspectRatio * 0.55));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.filter = bw ? 'grayscale(1) contrast(1.4) brightness(1.08)' : 'none';
  ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, width, height);

  const pixels = ctx.getImageData(0, 0, width, height).data;
  const chars = charSet.split('');
  const maxIndex = chars.length - 1;
  const boldCutoff = Math.floor(maxIndex * BOLD_THRESHOLD);
  const rows = new Array<string>(height);

  const scaleX = srcW / width;
  const scaleY = srcH / height;

  for (let y = 0; y < height; y++) {
    const row = new Array<string>(width);
    for (let x = 0; x < width; x++) {
      // Background mask
      if (mask) {
        const mx = clamp(Math.round(x * scaleX + srcX), 0, mask.width - 1);
        const my = clamp(Math.round(y * scaleY + srcY), 0, mask.height - 1);
        if (mask.data[my * mask.width + mx] < 0.5) {
          row[x] = fontWeight ? escapeHtml('.') : '.';
          continue;
        }
      }

      const luma = bw
        ? pixels[(y * width + x) * 4]
        : Math.round(
            0.299 * pixels[(y * width + x) * 4] +
            0.587 * pixels[(y * width + x) * 4 + 1] +
            0.114 * pixels[(y * width + x) * 4 + 2]
          );

      const charIndex = clamp(Math.round((1 - luma / 255) * maxIndex), 0, maxIndex);
      const char = chars[charIndex];

      if (fontWeight) {
        const esc = escapeHtml(char);
        row[x] = charIndex <= boldCutoff ? `<b>${esc}</b>` : esc;
      } else {
        row[x] = char;
      }
    }
    rows[y] = row.join('');
  }

  return rows.join('\n');
}
