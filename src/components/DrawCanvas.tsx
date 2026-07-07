import { useEffect, useRef } from 'react';
import type { Point } from '../core/frame';
import { paintFrame } from '../lib/render';

interface DrawCanvasProps {
  frame: Uint8Array;
  width: number;
  height: number;
  onionSkin?: Uint8Array;
  onStrokeSegment: (from: Point, to: Point) => void;
}

/** The drawing sheet: pointer events → stroke segments in frame pixel space. */
export default function DrawCanvas({
  frame,
  width,
  height,
  onionSkin,
  onStrokeSegment,
}: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<Point | null>(null);

  useEffect(() => {
    if (canvasRef.current) paintFrame(canvasRef.current, frame, width, height, onionSkin);
  }, [frame, width, height, onionSkin]);

  const toFrameSpace = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    };
  };

  return (
    <canvas
      ref={canvasRef}
      className="sheet"
      width={width}
      height={height}
      aria-label="Drawing sheet"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = toFrameSpace(e);
        lastPoint.current = p;
        onStrokeSegment(p, p);
      }}
      onPointerMove={(e) => {
        if (!lastPoint.current) return;
        const p = toFrameSpace(e);
        onStrokeSegment(lastPoint.current, p);
        lastPoint.current = p;
      }}
      onPointerUp={() => {
        lastPoint.current = null;
      }}
      onPointerCancel={() => {
        lastPoint.current = null;
      }}
    />
  );
}
