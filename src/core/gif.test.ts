import { describe, expect, test } from 'vitest';
import { GifReader } from 'omggif';
import { encodeGif } from './gif';
import { PALETTE } from './palette';

/**
 * The keystone: flipsmith encodes, an INDEPENDENT decoder (omggif — never
 * used at runtime) parses the container and inflates the LZW data back.
 */

function expectedRgba(frame: Uint8Array): Uint8Array {
  const out = new Uint8Array(frame.length * 4);
  frame.forEach((idx, i) => {
    const [r, g, b] = PALETTE[idx].rgb;
    out.set([r, g, b, 255], i * 4);
  });
  return out;
}

// omggif accepts any byte array at runtime; its types say Node Buffer
const readGif = (bytes: Uint8Array): GifReader =>
  new GifReader(bytes as unknown as ConstructorParameters<typeof GifReader>[0]);

function decodeAll(gif: Uint8Array, width: number, height: number) {
  const reader = readGif(gif);
  const frames: Uint8Array[] = [];
  for (let i = 0; i < reader.numFrames(); i++) {
    const pixels = new Uint8Array(width * height * 4);
    reader.decodeAndBlitFrameRGBA(i, pixels);
    frames.push(pixels);
  }
  return { reader, frames };
}

/** Deterministic noise frame over the full palette. */
function noiseFrame(width: number, height: number, seed: number): Uint8Array {
  let s = seed;
  return Uint8Array.from({ length: width * height }, () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >> 16) % PALETTE.length;
  });
}

describe('GIF89a container', () => {
  test('header, trailer, and infinite-loop extension', () => {
    const gif = encodeGif({
      width: 3,
      height: 3,
      frames: [Uint8Array.from({ length: 9 }, (_, i) => i % 16)],
      palette: PALETTE,
      delayCs: 10,
    });
    expect(String.fromCharCode(...gif.subarray(0, 6))).toBe('GIF89a');
    expect(gif[gif.length - 1]).toBe(0x3b);
    const reader = readGif(gif);
    expect(reader.loopCount()).toBe(0); // 0 = loop forever
  });

  test('rejects empty input and wrong-sized frames', () => {
    expect(() => encodeGif({ width: 2, height: 2, frames: [], palette: PALETTE, delayCs: 5 })).toThrow();
    expect(() =>
      encodeGif({ width: 2, height: 2, frames: [new Uint8Array(3)], palette: PALETTE, delayCs: 5 }),
    ).toThrow(/pixels/);
  });
});

describe('keystone: omggif round-trips every pixel', () => {
  const cases: [string, number, number, number][] = [
    ['1×1 minimum', 1, 1, 1],
    ['odd size stresses sub-block boundaries', 63, 47, 4],
    ['large noise forces dictionary resets', 200, 150, 3],
  ];

  for (const [name, width, height, frameCount] of cases) {
    test(name, () => {
      const source = Array.from({ length: frameCount }, (_, i) =>
        noiseFrame(width, height, 1000 + i * 77),
      );
      const gif = encodeGif({ width, height, frames: source, palette: PALETTE, delayCs: 7 });
      const { reader, frames } = decodeAll(gif, width, height);
      expect(reader.numFrames()).toBe(frameCount);
      expect(reader.width).toBe(width);
      expect(reader.height).toBe(height);
      for (let i = 0; i < frameCount; i++) {
        expect(reader.frameInfo(i).delay).toBe(7);
        expect(frames[i], `frame ${i} pixels`).toEqual(expectedRgba(source[i]));
      }
    });
  }

  test('flat single-color frame (best-case compression path)', () => {
    const source = new Uint8Array(80 * 60).fill(9);
    const gif = encodeGif({ width: 80, height: 60, frames: [source], palette: PALETTE, delayCs: 4 });
    expect(gif.length).toBeLessThan(1200); // tiny: runs collapse hard
    const { frames } = decodeAll(gif, 80, 60);
    expect(frames[0]).toEqual(expectedRgba(source));
  });
});
