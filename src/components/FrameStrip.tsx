import { useEffect, useRef } from 'react';
import { paintFrame } from '../lib/render';

interface FrameStripProps {
  frames: readonly Uint8Array[];
  width: number;
  height: number;
  active: number;
  onSelect: (index: number) => void;
}

function Thumb({
  frame,
  width,
  height,
}: {
  frame: Uint8Array;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintFrame(ref.current, frame, width, height);
  }, [frame, width, height]);
  return <canvas ref={ref} width={width} height={height} className="thumb-canvas" />;
}

/** The flipbook page strip: numbered thumbnails, active page flagged. */
export default function FrameStrip({ frames, width, height, active, onSelect }: FrameStripProps) {
  return (
    <ol className="frame-strip" aria-label="Frames">
      {frames.map((frame, i) => (
        <li key={i}>
          <button
            type="button"
            className={`thumb${i === active ? ' is-active' : ''}`}
            onClick={() => onSelect(i)}
            aria-label={`Frame ${i + 1}${i === active ? ' (current)' : ''}`}
          >
            <Thumb frame={frame} width={width} height={height} />
            <span className="thumb-number">{i + 1}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
