import { describe, expect, test } from 'vitest';
import { createFrame, drawStroke, stamp } from './frame';
import { INK, PAPER } from './palette';

describe('frame model', () => {
  test('createFrame fills with paper', () => {
    const f = createFrame(4, 3);
    expect(f).toHaveLength(12);
    expect(f.every((v) => v === PAPER)).toBe(true);
  });

  test('stamp paints a filled circle and returns a new frame', () => {
    const before = createFrame(20, 20);
    const after = stamp(before, 20, 20, { x: 10, y: 10 }, 3, INK);
    expect(before.every((v) => v === PAPER)).toBe(true); // input untouched
    expect(after[10 * 20 + 10]).toBe(INK);
    expect(after[10 * 20 + 13]).toBe(INK); // on the radius
    expect(after[10 * 20 + 14]).toBe(PAPER); // outside
    expect(after[6 * 20 + 6]).toBe(PAPER); // corner of bounding box, outside circle
  });

  test('stamp clips safely at the edges', () => {
    const f = stamp(createFrame(10, 10), 10, 10, { x: 0, y: 0 }, 4, INK);
    expect(f[0]).toBe(INK);
    expect(f).toHaveLength(100);
    const g = stamp(createFrame(10, 10), 10, 10, { x: 9, y: 9 }, 5, INK);
    expect(g[99]).toBe(INK);
  });

  test('strokes have no gaps: every column along the path gets ink', () => {
    const f = drawStroke(createFrame(60, 10), 60, 10, { x: 2, y: 5 }, { x: 57, y: 5 }, 2, INK);
    for (let x = 2; x <= 57; x++) {
      const column = Array.from({ length: 10 }, (_, y) => f[y * 60 + x]);
      expect(column, `column ${x}`).toContain(INK);
    }
  });

  test('zero-length stroke still stamps once', () => {
    const f = drawStroke(createFrame(10, 10), 10, 10, { x: 5, y: 5 }, { x: 5, y: 5 }, 2, INK);
    expect(f[5 * 10 + 5]).toBe(INK);
  });
});
