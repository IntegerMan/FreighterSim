import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import HeadingGauge from './HeadingGauge.vue';

// Minimal canvas context stub to satisfy drawGauge
function createCtxStub() {
  const noop = () => {};
  return {
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    stroke: noop,
    fillRect: noop,
    fill: noop,
    closePath: noop,
    setLineDash: noop,
    clearRect: noop,
    fillText: noop,
    strokeStyle: '#000',
    fillStyle: '#000',
    lineWidth: 1,
    font: '',
    textAlign: 'center' as CanvasTextAlign,
    textBaseline: 'middle' as CanvasTextBaseline,
  } as unknown as CanvasRenderingContext2D;
}

// Utility to mount with a stubbed canvas
function mountGauge() {
  const wrapper = mount(HeadingGauge, {
    props: {
      currentHeading: 0,
      targetHeading: 0,
    },
  });

  const canvas = wrapper.find('canvas').element as HTMLCanvasElement;

  // Define size and geometry so click math is deterministic
  Object.defineProperty(canvas, 'offsetWidth', { value: 200, writable: false });
  Object.defineProperty(canvas, 'offsetHeight', { value: 200, writable: false });
  canvas.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 200, width: 200, height: 200, toJSON: () => ({}) });

  // Stub getContext to our minimal ctx
  const ctxStub = createCtxStub();
  (canvas as any).getContext = vi.fn().mockReturnValue(ctxStub);

  return { wrapper, canvas, ctxStub };
}

function clickAt(wrapper: ReturnType<typeof mountGauge>['wrapper'], x: number, y: number) {
  const canvas = wrapper.find('canvas');
  canvas.trigger('click', { clientX: x, clientY: y });
}

describe('HeadingGauge click mapping', () => {
  beforeEach(() => {
    // Use a deterministic device pixel ratio
    Object.defineProperty(globalThis, 'devicePixelRatio', { value: 1, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps click at bottom (south) to heading 90°', async () => {
    const { wrapper } = mountGauge();
    // Center is at (100, 100); click near bottom center
    clickAt(wrapper, 100, 190);

    const emitted = wrapper.emitted('setHeading');
    expect(emitted).toBeTruthy();
    const heading = (emitted?.[0]?.[0] as number | undefined);
    expect(heading).toBeDefined();
    if (heading === undefined) return;
    expect(heading).toBeGreaterThan(85);
    expect(heading).toBeLessThan(95);
  });

  it('maps click at right (east) to heading 0°', async () => {
    const { wrapper } = mountGauge();
    clickAt(wrapper, 190, 100);

    const heading = (wrapper.emitted('setHeading')?.[0]?.[0] ?? -1) as number;
    expect(heading).toBeGreaterThan(-5);
    expect(heading).toBeLessThan(5);
  });

  it('maps click at top (north) to heading 270°', async () => {
    const { wrapper } = mountGauge();
    clickAt(wrapper, 100, 10);

    const heading = (wrapper.emitted('setHeading')?.[0]?.[0] ?? -1) as number;
    expect(heading).toBeGreaterThan(265);
    expect(heading).toBeLessThan(275);
  });
});
