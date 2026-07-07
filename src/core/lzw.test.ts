import { describe, expect, test } from 'vitest';
import { lzwEncode } from './lzw';

/**
 * Reference GIF-LZW decoder, implemented independently inside the test from
 * the decoder-side description of the algorithm (code table chase, deferred
 * clear, width bump after insert). If encoder and decoder disagreed on any
 * timing rule, round-trips would fail.
 */
function lzwDecode(bytes: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  // table: code -> [prefixCode, suffixByte]; singles are implicit
  let table = new Map<number, [number, number]>();
  const expand = (code: number): number[] => {
    const outRev: number[] = [];
    let c = code;
    while (c >= clearCode) {
      const [prefix, suffix] = table.get(c)!;
      outRev.push(suffix);
      c = prefix;
    }
    outRev.push(c);
    return outRev.reverse();
  };

  const out: number[] = [];
  let bitPos = 0;
  const readCode = (): number => {
    let v = 0;
    for (let i = 0; i < codeSize; i++, bitPos++) {
      v |= ((bytes[bitPos >> 3] >> (bitPos & 7)) & 1) << i;
    }
    return v;
  };

  let prev: number | null = null;
  for (;;) {
    const code = readCode();
    if (code === eoiCode) break;
    if (code === clearCode) {
      table = new Map();
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      prev = null;
      continue;
    }
    let seq: number[];
    if (code < nextCode && (code < clearCode || table.has(code))) {
      seq = expand(code);
    } else {
      // the KwKwK case: code not yet in the table
      const prevSeq = expand(prev!);
      seq = [...prevSeq, prevSeq[0]];
    }
    out.push(...seq);
    if (prev !== null && nextCode < 4096) {
      table.set(nextCode++, [prev, seq[0]]);
      if (nextCode >= 1 << codeSize && codeSize < 12) codeSize++;
    }
    prev = code;
    if (out.length >= pixelCount) break;
  }
  return Uint8Array.from(out.slice(0, pixelCount));
}

const roundTrip = (indices: Uint8Array, minCodeSize: number) => {
  const encoded = lzwEncode(indices, minCodeSize);
  return lzwDecode(encoded, minCodeSize, indices.length);
};

describe('LZW encoder', () => {
  test('hand-computed bit stream for [0, 1] at min code size 2', () => {
    // codes: CLEAR(4), 0, 1, EOI(5), all 3 bits, LSB-first → 0x44, 0x0a
    expect(Array.from(lzwEncode(Uint8Array.from([0, 1]), 2))).toEqual([0x44, 0x0a]);
  });

  test('single pixel', () => {
    const src = Uint8Array.from([7]);
    expect(roundTrip(src, 4)).toEqual(src);
  });

  test('long uniform run compresses and round-trips', () => {
    const src = new Uint8Array(10_000).fill(3);
    const encoded = lzwEncode(src, 4);
    expect(encoded.length).toBeLessThan(src.length / 10);
    expect(roundTrip(src, 4)).toEqual(src);
  });

  test('repeating pattern exercises the KwKwK case', () => {
    const src = Uint8Array.from({ length: 5000 }, (_, i) => i % 2);
    expect(roundTrip(src, 2)).toEqual(src);
  });

  test('high-entropy stream forces dictionary resets at 4096', () => {
    // LCG noise over 16 symbols, long enough to overflow the table repeatedly
    let s = 12345;
    const src = Uint8Array.from({ length: 120_000 }, () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return (s >> 16) & 0x0f;
    });
    expect(roundTrip(src, 4)).toEqual(src);
  });

  test('every palette size min code width round-trips', () => {
    for (const minCodeSize of [2, 3, 4, 5, 6, 7, 8]) {
      const symbols = 1 << minCodeSize;
      const src = Uint8Array.from({ length: 3000 }, (_, i) => (i * 7 + (i % 11)) % symbols);
      expect(roundTrip(src, minCodeSize)).toEqual(src);
    }
  });
});
