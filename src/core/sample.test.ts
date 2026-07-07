import { describe, expect, test } from 'vitest';
import { GifReader } from 'omggif';
import { encodeGif } from './gif';
import { PALETTE } from './palette';
import {
  SAMPLE_DELAY_CS,
  SAMPLE_FRAME_COUNT,
  SAMPLE_HEIGHT,
  SAMPLE_WIDTH,
  sampleFrames,
} from './sample';

describe('bundled sample animation', () => {
  const frames = sampleFrames();

  test('is deterministic and correctly sized', () => {
    expect(frames).toHaveLength(SAMPLE_FRAME_COUNT);
    expect(sampleFrames()).toEqual(frames);
    for (const f of frames) expect(f).toHaveLength(SAMPLE_WIDTH * SAMPLE_HEIGHT);
  });

  test('every index is inside the palette', () => {
    for (const f of frames) {
      for (const v of f) expect(v).toBeLessThan(PALETTE.length);
    }
  });

  test('the ball actually moves between frames', () => {
    const diffs = frames.slice(1).map((f, i) => {
      let d = 0;
      for (let p = 0; p < f.length; p++) if (f[p] !== frames[i][p]) d++;
      return d;
    });
    for (const d of diffs) expect(d).toBeGreaterThan(100);
  });

  test('compiles into a decodable GIF end to end', () => {
    const gif = encodeGif({
      width: SAMPLE_WIDTH,
      height: SAMPLE_HEIGHT,
      frames,
      palette: PALETTE,
      delayCs: SAMPLE_DELAY_CS,
    });
    // omggif accepts any byte array at runtime; its types say Node Buffer
    const reader = new GifReader(gif as unknown as ConstructorParameters<typeof GifReader>[0]);
    expect(reader.numFrames()).toBe(SAMPLE_FRAME_COUNT);
    expect(reader.frameInfo(0).delay).toBe(SAMPLE_DELAY_CS);
  });
});
