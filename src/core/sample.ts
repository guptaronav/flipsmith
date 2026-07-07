import { createFrame, drawStroke, stamp } from './frame';
import { INK, PAPER } from './palette';

/**
 * Deterministic bundled sample: a col-erase red ball bouncing across the
 * page, squashing on impact, over an ink ground line. No randomness — the
 * sample is reproducible in tests.
 */

export const SAMPLE_WIDTH = 240;
export const SAMPLE_HEIGHT = 180;
export const SAMPLE_FRAME_COUNT = 10;
export const SAMPLE_DELAY_CS = 8;

const BALL = 4; // col-erase red
const SHADOW = 14; // cloud gray
const GROUND_Y = 150;
const RADIUS = 14;

function ballCenter(t: number): { x: number; y: number; squash: number } {
  // one full bounce arc across the canvas; t in [0, 1)
  const x = 24 + t * (SAMPLE_WIDTH - 48);
  const phase = Math.abs(Math.sin(t * Math.PI * 2));
  const y = GROUND_Y - RADIUS - phase * 92;
  const squash = phase < 0.18 ? 1 - (0.18 - phase) * 2 : 1;
  return { x, y: Math.min(y, GROUND_Y - RADIUS * squash), squash };
}

export function sampleFrames(): Uint8Array[] {
  return Array.from({ length: SAMPLE_FRAME_COUNT }, (_, i) => {
    const t = i / SAMPLE_FRAME_COUNT;
    let frame = createFrame(SAMPLE_WIDTH, SAMPLE_HEIGHT, PAPER);
    // ground line
    frame = drawStroke(
      frame,
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT,
      { x: 10, y: GROUND_Y },
      { x: SAMPLE_WIDTH - 10, y: GROUND_Y },
      2,
      INK,
    );
    const { x, y, squash } = ballCenter(t);
    // contact shadow, wider when the ball is low
    const closeness = 1 - Math.min(1, (GROUND_Y - y) / 110);
    frame = drawStroke(
      frame,
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT,
      { x: x - 8 - 6 * closeness, y: GROUND_Y + 5 },
      { x: x + 8 + 6 * closeness, y: GROUND_Y + 5 },
      3,
      SHADOW,
    );
    // squash: draw as a horizontal run of stamps when compressed
    const ry = RADIUS * squash;
    const rx = RADIUS * (2 - squash);
    frame = drawStroke(
      frame,
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT,
      { x: x - (rx - ry), y },
      { x: x + (rx - ry), y },
      ry,
      BALL,
    );
    frame = stamp(frame, SAMPLE_WIDTH, SAMPLE_HEIGHT, { x, y }, ry, BALL);
    return frame;
  });
}
