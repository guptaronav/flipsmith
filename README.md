# flipsmith 📖

[![CI](https://github.com/guptaronav/flipsmith/actions/workflows/ci.yml/badge.svg)](https://github.com/guptaronav/flipsmith/actions/workflows/ci.yml)

**Live: https://guptaronav.github.io/flipsmith/**

**Draw a flipbook in the browser — download a real animated GIF.
LZW and the GIF89a container, written from scratch. No GIF library at runtime.**

Every byte of the file comes out of code in this repo: variable-width LZW
codes, dictionary resets at 4096 entries, LSB-first bit packing, sub-block
framing, the NETSCAPE loop extension. The live preview isn't a simulation —
it's the encoded `.gif` itself, handed to the browser's own decoder.

## 30-second demo

1. `npm install && npm run dev` — open the local URL.
2. Click **Load sample** — a bouncing-ball flipbook appears, already looping
   in the preview. That loop *is* the encoded GIF, byte for byte.
3. Flip through the pages, scribble on one with the col-erase pencils — the
   onion skin shows the previous page in non-photo cyan, like a real light
   table.
4. **Download .gif** → drop it in iMessage or Slack. It plays everywhere,
   because it's a real GIF89a file.

Zero API keys. Zero network calls. Works offline.

## How it works

The app draws in **indexed-color space from the start** — each page is a
`Uint8Array` of palette indices. No quantization step, no antialiasing
artifacts: the GIF encodes exactly the pixels you drew.

```
pointer events → circle-brush stamps interpolated along the stroke
  → per-page index buffer (fixed 16-color animator palette)
  → GIF89a writer: header / screen descriptor / global color table
    → NETSCAPE2.0 loop extension
    → per page: graphic control (delay) + image descriptor + LZW data
  → one Uint8Array → looping preview <img> and the download, same bytes
```

## Verified independently

The tests never trust the encoder's own math:

- **omggif** (independent decoder, dev-only) re-inflates every encoded GIF —
  frame counts, delays, loop flag, and **pixel-exact RGBA** for every frame,
  including 1×1, odd sizes that stress sub-block boundaries, and
  high-entropy frames that force LZW dictionary resets.
- A reference LZW decoder written inside the test suite round-trips the raw
  code stream, including the KwKwK edge case and a hand-computed byte-level
  case.

## Development

```bash
npm install
npm run dev     # local dev server
npm test        # vitest — 21 tests
npm run lint    # eslint
npm run build   # typecheck + production build
```

## Credits

Built with [Claude Code](https://claude.com/claude-code) (Claude Sonnet 5): wrote some of the CSS, some of the TypeScript, and handled all commits/pushes and the GitHub Pages deployment for this repo.

## License

MIT
