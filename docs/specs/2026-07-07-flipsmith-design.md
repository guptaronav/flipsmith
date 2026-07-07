# flipsmith — design

## One-liner

A flipbook animation desk where the **GIF89a encoder is written from
scratch** — LZW compression with variable-width codes and dictionary resets,
LSB-first bit packing, sub-block framing, the NETSCAPE loop extension. No GIF
library at runtime; an independent decoder (omggif, dev-only) reads every
encoded GIF back pixel-for-pixel in CI.

## Why this concept

- Non-overlapping with the org's 25 existing repos (nothing touches
  compression or container formats).
- LZW is a real algorithm with real pitfalls (code-width growth timing, the
  4096-entry reset, sub-block boundaries) — a core trick worth showing.
- The demo output is universally shareable: an animated GIF plays in iMessage,
  Slack, and every browser since 1996.
- Zero API keys, zero network, works offline.

## Architecture

The app draws in **indexed-color space from the start** — each frame is a
`Uint8Array` of palette indices, rendered to canvas for display. No
quantization step, no antialiasing artifacts: the GIF encodes exactly the
bytes the user drew.

```
pointer events → brush stamps (circle, interpolated along the stroke)
              → per-frame index buffer (Uint8Array, fixed 16-color palette)
              → GIF89a writer: header/LSD/GCT → NETSCAPE loop ext
                → per frame: GCE (delay) + image descriptor + LZW data
              → Blob download / <img> live preview from the same bytes
```

## Modules

| File | Responsibility |
|---|---|
| `core/palette.ts` | the fixed 16-color animator palette (hex + RGB triples) |
| `core/frame.ts` | frame model, brush stamping, stroke interpolation |
| `core/lzw.ts` | from-scratch GIF-flavor LZW with variable code widths |
| `core/gif.ts` | GIF89a container writer (`encodeGif(frames, opts)`) |
| `core/sample.ts` | deterministic bouncing-ball sample animation |

## Testing

- **Keystone:** encode → decode with omggif (independent, dev-only) → assert
  frame count, exact pixel equality per frame (RGBA via palette), delays,
  infinite-loop flag, dimensions. Swept over sizes including 1×1 and odd
  widths (sub-block edge cases) and ≥4096-sequence inputs (dictionary reset).
- LZW unit tests: hand-computed small streams, code-width growth, clear-code
  handling, max-dictionary reset.
- Frame model tests: stamp geometry, stroke interpolation, bounds safety.
- Sample tests: deterministic, in-bounds, ball moves between frames.

## UI — "animator's light table" direction

Cool gray-blue desk, classic col-erase pencil accents (non-photo cyan +
red), Archivo (display) + Space Mono (data). Layout: frame strip across the
top (thumbnails + add/duplicate/delete), drawing canvas center with
onion-skin ghost of the previous frame, looping live preview + controls on
the right (fps, brush, palette swatches, download).

## Out of scope (deliberate)

- Color quantization / arbitrary palettes — the fixed palette is the product.
- Per-frame local color tables, transparency, disposal tricks.
- Layers, selection tools, fill tool.

## Quality bar checklist

- [ ] 5+ progressive commits (docs → scaffold → core → UI → CI)
- [ ] Tests pass locally before every push
- [ ] Green GitHub Actions CI
- [ ] Zero-API-key demo (no network at all)
- [ ] MIT license, README with 30-second demo script
- [ ] oklch tokens, display+mono pairing, non-template UI
