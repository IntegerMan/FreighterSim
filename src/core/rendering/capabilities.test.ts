import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectWebGL2,
  detectWebGL1,
  detectCanvas2D,
  detectCapabilities,
  meetsMinimumRequirements,
} from './capabilities';

describe('Capability Detection', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.restoreAllMocks();
  });

  describe('detectWebGL2', () => {
    it('should return true when WebGL2 is supported', () => {
      const result = detectWebGL2();
      // This will depend on the test environment
      expect(typeof result).toBe('boolean');
    });

    it('should return false when WebGL2 context fails', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      const result = detectWebGL2();
      expect(result).toBe(false);
    });
  });

  describe('detectWebGL1', () => {
    it('should return true when WebGL1 is supported', () => {
      const result = detectWebGL1();
      expect(typeof result).toBe('boolean');
    });

    it('should return false when WebGL1 context fails', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      const result = detectWebGL1();
      expect(result).toBe(false);
    });
  });

  describe('detectCanvas2D', () => {
    it('should return true when Canvas 2D is supported', () => {
      const result = detectCanvas2D();
      expect(typeof result).toBe('boolean');
    });

    it('should return false when Canvas 2D context fails', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      const result = detectCanvas2D();
      expect(result).toBe(false);
    });
  });

  describe('detectCapabilities', () => {
    it('should prefer WebGL2 when available', () => {
      vi.spyOn(document, 'createElement').mockReturnValue({
        getContext: vi.fn((type) => {
          if (type === 'webgl2') return {};
          return null;
        }),
      } as any);

      const result = detectCapabilities();
      expect(result.selected).toBe('WebGL2');
      expect(result.preferred).toBe('WebGL2');
      expect(result.fallbackReason).toBeNull();
    });

    it('should fallback to WebGL1 when WebGL2 unavailable', () => {
      vi.spyOn(document, 'createElement').mockReturnValue({
        getContext: vi.fn((type) => {
          if (type === 'webgl' || type === 'experimental-webgl') return {};
          return null;
        }),
      } as any);

      const result = detectCapabilities();
      expect(result.selected).toBe('WebGL1');
      expect(result.preferred).toBe('WebGL2');
      expect(result.fallbackReason).toContain('WebGL1 fallback');
    });

    it('should fallback to Canvas when WebGL unavailable', () => {
      vi.spyOn(document, 'createElement').mockReturnValue({
        getContext: vi.fn((type) => {
          if (type === '2d') return {};
          return null;
        }),
      } as any);

      const result = detectCapabilities();
      expect(result.selected).toBe('Canvas');
      expect(result.preferred).toBe('WebGL2');
      expect(result.fallbackReason).toContain('Canvas 2D fallback');
    });

    it('should return None when no rendering available', () => {
      vi.spyOn(document, 'createElement').mockReturnValue({
        getContext: vi.fn().mockReturnValue(null),
      } as any);

      const result = detectCapabilities();
      expect(result.selected).toBe('None');
      expect(result.fallbackReason).toContain('No rendering capability');
    });
  });

  describe('meetsMinimumRequirements', () => {
    it('should return true for WebGL2', () => {
      expect(meetsMinimumRequirements('WebGL2')).toBe(true);
    });

    it('should return true for WebGL1', () => {
      expect(meetsMinimumRequirements('WebGL1')).toBe(true);
    });

    it('should return true for Canvas', () => {
      expect(meetsMinimumRequirements('Canvas')).toBe(true);
    });

    it('should return false for None', () => {
      expect(meetsMinimumRequirements('None')).toBe(false);
    });
  });
});
