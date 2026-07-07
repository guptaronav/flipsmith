/**
 * GIF-flavor LZW, written from scratch: variable-width codes (min+1 up to 12
 * bits), LSB-first bit packing, an initial CLEAR, and a CLEAR + dictionary
 * reset when the table hits 4096 entries. Width-growth timing follows the
 * GIF convention: the width bumps just before inserting the first code that
 * would not fit the current size.
 */

const MAX_CODE = 4096;
const MAX_CODE_SIZE = 12;

class BitWriter {
  private bytes: number[] = [];
  private cur = 0;
  private shift = 0;

  write(code: number, size: number): void {
    this.cur |= code << this.shift;
    this.shift += size;
    while (this.shift >= 8) {
      this.bytes.push(this.cur & 0xff);
      this.cur >>>= 8;
      this.shift -= 8;
    }
  }

  finish(): Uint8Array {
    if (this.shift > 0) this.bytes.push(this.cur & 0xff);
    return Uint8Array.from(this.bytes);
  }
}

/** Compress an index stream. Returns the raw code bytes (not sub-blocked). */
export function lzwEncode(indices: Uint8Array, minCodeSize: number): Uint8Array {
  if (indices.length === 0) throw new Error('nothing to compress');
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  let dict = new Map<number, number>();
  const out = new BitWriter();

  out.write(clearCode, codeSize);
  let seq = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (seq << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) {
      seq = hit;
      continue;
    }
    out.write(seq, codeSize);
    if (nextCode === MAX_CODE) {
      out.write(clearCode, codeSize);
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      dict = new Map();
    } else {
      if (nextCode >= 1 << codeSize && codeSize < MAX_CODE_SIZE) codeSize++;
      dict.set(key, nextCode++);
    }
    seq = k;
  }
  out.write(seq, codeSize);
  out.write(eoiCode, codeSize);
  return out.finish();
}
