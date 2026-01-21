import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Mock requestAnimationFrame for game loop testing
let rafId = 0;
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
  rafId++;
  setTimeout(() => callback(performance.now()), 16);
  return rafId;
});

vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
  clearTimeout(id);
});

// Mock canvas context for rendering tests
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'top' as CanvasTextBaseline,
  globalAlpha: 1,
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Vue Test Utils global config
config.global.stubs = {};
