import { useEffect, useMemo, useRef, useState } from 'react';
import DrawCanvas from './components/DrawCanvas';
import FrameStrip from './components/FrameStrip';
import { createFrame, drawStroke, type Point } from './core/frame';
import { encodeGif } from './core/gif';
import { INK, PALETTE, PAPER } from './core/palette';
import { SAMPLE_DELAY_CS, sampleFrames } from './core/sample';

const WIDTH = 240;
const HEIGHT = 180;
const MAX_FRAMES = 24;
const PREVIEW_DEBOUNCE_MS = 250;

const BRUSHES = [
  { name: 'pencil', radius: 1.6 },
  { name: 'marker', radius: 4 },
  { name: 'brush', radius: 8 },
] as const;

export default function App() {
  const [frames, setFrames] = useState<Uint8Array[]>([createFrame(WIDTH, HEIGHT)]);
  const [active, setActive] = useState(0);
  const [colorIndex, setColorIndex] = useState(INK);
  const [brush, setBrush] = useState(0);
  const [erasing, setErasing] = useState(false);
  const [onion, setOnion] = useState(true);
  const [fps, setFps] = useState(12);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const gifBytes = useRef<Uint8Array | null>(null);

  const delayCs = Math.max(2, Math.round(100 / fps));

  // the live preview IS the encoded GIF, the browser's own decoder plays it
  useEffect(() => {
    const timer = setTimeout(() => {
      const gif = encodeGif({ width: WIDTH, height: HEIGHT, frames, palette: PALETTE, delayCs });
      gifBytes.current = gif;
      const url = URL.createObjectURL(new Blob([gif], { type: 'image/gif' }));
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [frames, delayCs]);

  const onStrokeSegment = (from: Point, to: Point) => {
    const radius = erasing ? BRUSHES[brush].radius * 2 : BRUSHES[brush].radius;
    const color = erasing ? PAPER : colorIndex;
    setFrames((fs) =>
      fs.map((f, i) => (i === active ? drawStroke(f, WIDTH, HEIGHT, from, to, radius, color) : f)),
    );
  };

  const addFrame = (duplicate: boolean) => {
    if (frames.length >= MAX_FRAMES) return;
    const fresh = duplicate ? Uint8Array.from(frames[active]) : createFrame(WIDTH, HEIGHT);
    setFrames((fs) => [...fs.slice(0, active + 1), fresh, ...fs.slice(active + 1)]);
    setActive(active + 1);
  };

  const deleteFrame = () => {
    if (frames.length <= 1) return;
    setFrames((fs) => fs.filter((_, i) => i !== active));
    setActive(Math.max(0, active - 1));
  };

  const clearFrame = () => {
    setFrames((fs) => fs.map((f, i) => (i === active ? createFrame(WIDTH, HEIGHT) : f)));
  };

  const loadSample = () => {
    setFrames(sampleFrames());
    setActive(0);
    setFps(Math.round(100 / SAMPLE_DELAY_CS));
  };

  const download = () => {
    if (!gifBytes.current) return;
    const url = URL.createObjectURL(new Blob([gifBytes.current], { type: 'image/gif' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flipsmith.gif';
    a.click();
    URL.revokeObjectURL(url);
  };

  const inkUsed = useMemo(
    () => frames.reduce((n, f) => n + (f.some((v) => v !== PAPER) ? 1 : 0), 0),
    [frames],
  );

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1 className="wordmark">
            flip<em>smith</em>
          </h1>
          <p className="tagline">
            draw a flipbook, the GIF you download is compressed by LZW written from
            scratch, and the preview is those exact bytes.
          </p>
        </div>
        <div className="masthead-actions">
          <button type="button" className="btn" onClick={loadSample}>
            Load sample
          </button>
          <button
            type="button"
            className="btn btn--red"
            onClick={download}
            disabled={inkUsed === 0}
          >
            Download .gif
          </button>
        </div>
      </header>

      <FrameStrip frames={frames} width={WIDTH} height={HEIGHT} active={active} onSelect={setActive} />

      <div className="frame-ops">
        <button type="button" className="btn btn--small" onClick={() => addFrame(false)} disabled={frames.length >= MAX_FRAMES}>
          + blank
        </button>
        <button type="button" className="btn btn--small" onClick={() => addFrame(true)} disabled={frames.length >= MAX_FRAMES}>
          + duplicate
        </button>
        <button type="button" className="btn btn--small" onClick={deleteFrame} disabled={frames.length <= 1}>
          delete
        </button>
        <button type="button" className="btn btn--small" onClick={clearFrame}>
          clear page
        </button>
        <span className="frame-count">
          page {active + 1}/{frames.length}
        </span>
      </div>

      <main className="desk">
        <section className="table" aria-label="Light table">
          <DrawCanvas
            frame={frames[active]}
            width={WIDTH}
            height={HEIGHT}
            onionSkin={onion && active > 0 ? frames[active - 1] : undefined}
            onStrokeSegment={onStrokeSegment}
          />
        </section>

        <aside className="tools" aria-label="Tools">
          <div className="tool-group">
            <span className="tool-label">pencils</span>
            <div className="swatches" role="group" aria-label="Colors">
              {PALETTE.map((c, i) =>
                i === PAPER ? null : (
                  <button
                    key={c.hex}
                    type="button"
                    className={`swatch${i === colorIndex && !erasing ? ' is-active' : ''}`}
                    style={{ background: c.hex }}
                    title={c.name}
                    aria-label={c.name}
                    onClick={() => {
                      setColorIndex(i);
                      setErasing(false);
                    }}
                  />
                ),
              )}
            </div>
          </div>

          <div className="tool-group">
            <span className="tool-label">brush</span>
            <div className="seg" role="group">
              {BRUSHES.map((b, i) => (
                <button
                  key={b.name}
                  type="button"
                  className={`seg-btn${i === brush && !erasing ? ' is-active' : ''}`}
                  onClick={() => {
                    setBrush(i);
                    setErasing(false);
                  }}
                >
                  {b.name}
                </button>
              ))}
              <button
                type="button"
                className={`seg-btn${erasing ? ' is-active' : ''}`}
                onClick={() => setErasing(true)}
              >
                eraser
              </button>
            </div>
          </div>

          <label className="tool-group" htmlFor="fps">
            <span className="tool-label">speed: {fps} fps</span>
            <input
              id="fps"
              type="range"
              min={4}
              max={24}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
            />
          </label>

          <label className="tool-group tool-check">
            <input type="checkbox" checked={onion} onChange={(e) => setOnion(e.target.checked)} />
            <span>onion skin (previous page in cyan)</span>
          </label>

          <div className="tool-group">
            <span className="tool-label">the real thing</span>
            {previewUrl && inkUsed > 0 ? (
              <img className="preview" src={previewUrl} alt="Looping preview of your GIF" />
            ) : (
              <p className="preview-empty">draw on a page and the encoded GIF loops here</p>
            )}
            <p className="preview-note">
              this preview is not a simulation, it is the .gif file, byte for byte
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
