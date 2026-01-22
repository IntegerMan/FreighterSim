import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import HeadingGauge from './HeadingGauge.vue';

// Minimal canvas context stub to satisfy drawGauge
function createCtxStub() {
  const noop = () => { };
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
      waypointHeading: null,
    },
  });

  const canvas = wrapper.find('canvas').element as HTMLCanvasElement;

  // Define size and geometry so click math is deterministic
  // HeadingGauge uses fixed radius=60, centerX=70, centerY=70
  Object.defineProperty(canvas, 'offsetWidth', { value: 140, writable: false });
  Object.defineProperty(canvas, 'offsetHeight', { value: 140, writable: false });
  canvas.getBoundingClientRect = () => ({
    x: 0, y: 0, top: 0, left: 0, right: 140, bottom: 140, width: 140, height: 140,
    toJSON: () => ({})
  } as DOMRect);

  // Stub getContext to our minimal ctx
  const ctxStub = createCtxStub();
  (canvas as unknown as { getContext: typeof vi.fn }).getContext = vi.fn().mockReturnValue(ctxStub);

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

  // Click mapping uses atan2(deltaY, deltaX) + 90, with center at (70, 70):
  // - Top (70, 10): deltaX=0, deltaY=-60 → atan2(-60, 0)=-90° → +90 = 0° (North)
  // - Right (130, 70): deltaX=60, deltaY=0 → atan2(0, 60)=0° → +90 = 90° (East)
  // - Bottom (70, 130): deltaX=0, deltaY=60 → atan2(60, 0)=90° → +90 = 180° (South)
  // - Left (10, 70): deltaX=-60, deltaY=0 → atan2(0, -60)=180° → +90 = 270° (West)

  it('maps click at top (north) to heading 0°', async () => {
    const { wrapper } = mountGauge();
    clickAt(wrapper, 70, 10);

    const emitted = wrapper.emitted('setHeading');
    expect(emitted).toBeTruthy();
    const heading = (emitted?.[0]?.[0] as number | undefined);
    expect(heading).toBeDefined();
    if (heading === undefined) return;
    expect(heading).toBeCloseTo(0, 1);
  });

  it('maps click at right (east) to heading 90°', async () => {
    const { wrapper } = mountGauge();
    clickAt(wrapper, 130, 70);

    const emitted = wrapper.emitted('setHeading');
    expect(emitted).toBeTruthy();
    const heading = (emitted?.[0]?.[0] as number | undefined);
    expect(heading).toBeCloseTo(90, 1);
  });

  it('maps click at bottom (south) to heading 180°', async () => {
    const { wrapper } = mountGauge();
    clickAt(wrapper, 70, 130);

    const emitted = wrapper.emitted('setHeading');
    expect(emitted).toBeTruthy();
    const heading = (emitted?.[0]?.[0] as number | undefined);
    expect(heading).toBeCloseTo(180, 1);
  });
});
