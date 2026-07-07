/** The fixed 16-color animator palette. Index 0 is the paper. */

export interface PaletteColor {
  name: string;
  hex: string;
  rgb: readonly [number, number, number];
}

const color = (name: string, hex: string): PaletteColor => {
  const n = parseInt(hex.slice(1), 16);
  return { name, hex, rgb: [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff] };
};

export const PALETTE: readonly PaletteColor[] = [
  color('paper', '#f6f3ec'),
  color('ink', '#26242b'),
  color('graphite', '#6d6a75'),
  color('non-photo cyan', '#57c4dc'),
  color('col-erase red', '#e5484d'),
  color('orange', '#f0883a'),
  color('marigold', '#e8b73a'),
  color('leaf', '#5da154'),
  color('teal', '#2f8f83'),
  color('ultramarine', '#3f63c8'),
  color('violet', '#7d5bbe'),
  color('magenta', '#c74e93'),
  color('sepia', '#8a5a3b'),
  color('tan', '#d9b98f'),
  color('cloud', '#c9c5bb'),
  color('sky', '#a8d4e2'),
];

export const PAPER = 0;
export const INK = 1;
