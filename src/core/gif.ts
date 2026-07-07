import { lzwEncode } from './lzw';
import type { PaletteColor } from './palette';

/**
 * GIF89a container writer, from scratch: logical screen descriptor, global
 * color table, NETSCAPE2.0 infinite-loop extension, and per frame a graphic
 * control extension + image descriptor + sub-blocked LZW data.
 */

export interface GifOptions {
  width: number;
  height: number;
  /** One Uint8Array of palette indices (width×height) per frame. */
  frames: readonly Uint8Array[];
  palette: readonly PaletteColor[];
  /** Delay per frame in centiseconds (GIF's native unit). */
  delayCs: number;
}

const SUB_BLOCK_MAX = 255;

export function encodeGif({ width, height, frames, palette, delayCs }: GifOptions): Uint8Array {
  if (frames.length === 0) throw new Error('need at least one frame');
  for (const f of frames) {
    if (f.length !== width * height) {
      throw new Error(`frame has ${f.length} pixels, expected ${width * height}`);
    }
  }

  // pad the color table to a power of two (GIF requires it)
  let gctSizeBits = 1;
  while (1 << gctSizeBits < palette.length) gctSizeBits++;
  const gctEntries = 1 << gctSizeBits;
  const minCodeSize = Math.max(2, gctSizeBits);

  const out: number[] = [];
  const bytes = (...vs: number[]) => out.push(...vs);
  const u16 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff);
  const ascii = (s: string) => {
    for (const ch of s) out.push(ch.charCodeAt(0));
  };

  ascii('GIF89a');
  u16(width);
  u16(height);
  bytes(0x80 | 0x70 | (gctSizeBits - 1), 0, 0); // GCT present, 8-bit color res
  for (let i = 0; i < gctEntries; i++) {
    const [r, g, b] = palette[i]?.rgb ?? [0, 0, 0];
    bytes(r, g, b);
  }

  // NETSCAPE2.0 application extension: loop forever
  bytes(0x21, 0xff, 0x0b);
  ascii('NETSCAPE2.0');
  bytes(0x03, 0x01);
  u16(0); // 0 = infinite
  bytes(0x00);

  for (const frame of frames) {
    // graphic control extension: keep previous frame, then draw over it
    bytes(0x21, 0xf9, 0x04, 0x04);
    u16(delayCs);
    bytes(0x00, 0x00);
    // image descriptor: full-canvas frame, no local table, not interlaced
    bytes(0x2c);
    u16(0);
    u16(0);
    u16(width);
    u16(height);
    bytes(0x00);
    // sub-blocked LZW data
    bytes(minCodeSize);
    const data = lzwEncode(frame, minCodeSize);
    for (let i = 0; i < data.length; i += SUB_BLOCK_MAX) {
      const chunk = data.subarray(i, i + SUB_BLOCK_MAX);
      bytes(chunk.length, ...chunk);
    }
    bytes(0x00);
  }

  bytes(0x3b); // trailer
  return Uint8Array.from(out);
}
