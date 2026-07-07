import { PALETTE, PAPER } from '../core/palette';

/** Paint an indexed frame onto a canvas, with an optional onion-skin ghost. */
export function paintFrame(
  canvas: HTMLCanvasElement,
  frame: Uint8Array,
  width: number,
  height: number,
  onionSkin?: Uint8Array,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(width, height);
  for (let i = 0; i < frame.length; i++) {
    let [r, g, b] = PALETTE[frame[i]].rgb;
    if (frame[i] === PAPER && onionSkin && onionSkin[i] !== PAPER) {
      // ghost of the previous frame in pale non-photo cyan
      r = 190;
      g = 224;
      b = 236;
    }
    img.data.set([r, g, b, 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
}
