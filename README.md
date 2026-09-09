# flipsmith

[![CI](https://github.com/guptaronav/flipsmith/actions/workflows/ci.yml/badge.svg)](https://github.com/guptaronav/flipsmith/actions/workflows/ci.yml)

**Live: https://guptaronav.github.io/flipsmith/**

**Draw a flipbook in the browser — download a real animated GIF.
LZW and the GIF89a container, written from scratch. No GIF library at runtime.**

Every byte of the file comes out of code in this repo: variable-width LZW
codes, dictionary resets at 4096 entries, LSB-first bit packing, sub-block
framing, the NETSCAPE loop extension. The live preview isn't a simulation —
it's the encoded `.gif` itself, handed to the browser's own decoder.

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
## Credits

Built with [Claude Code](https://claude.com/claude-code) (Claude Sonnet 5): wrote some of the CSS, some of the TypeScript, and handled all commits/pushes and the GitHub Pages deployment for this repo.

## License

MIT
