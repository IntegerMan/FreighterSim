/**
 * Capability detection for rendering backend selection.
 * Detects WebGL2, WebGL1, and Canvas fallback support.
 */

export type RendererCapability = 'WebGL2' | 'WebGL1' | 'Canvas' | 'None';

export interface CapabilityDetectionResult {
  /** Preferred capability based on browser support */
  preferred: RendererCapability;
  
  /** Selected capability for use (may differ from preferred due to fallback) */
  selected: RendererCapability;
  
  /** Reason for fallback if selected differs from preferred */
  fallbackReason: string | null;
}

/**
 * Detects WebGL2 support in the browser.
 */
export function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl) {
      return true;
    }
  } catch {
    // WebGL2 not supported
  }
  return false;
}

/**
 * Detects WebGL1 support in the browser.
 */
export function detectWebGL1(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      return true;
    }
  } catch {
    // WebGL1 not supported
  }
  return false;
}

/**
 * Detects Canvas 2D support (should always be available in modern browsers).
 */
export function detectCanvas2D(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return ctx !== null;
  } catch {
    // Canvas not supported
  }
  return false;
}

/**
 * Performs capability detection and returns the best available rendering backend.
 * Priority: WebGL2 > WebGL1 > Canvas > None
 */
export function detectCapabilities(): CapabilityDetectionResult {
  let preferred: RendererCapability = 'None';
  let selected: RendererCapability = 'None';
  let fallbackReason: string | null = null;

  // Check WebGL2 first (preferred)
  if (detectWebGL2()) {
    preferred = 'WebGL2';
    selected = 'WebGL2';
  }
  // Fallback to WebGL1
  else if (detectWebGL1()) {
    preferred = 'WebGL2';
    selected = 'WebGL1';
    fallbackReason = 'WebGL2 not supported, using WebGL1 fallback';
  }
  // Last resort: Canvas 2D
  else if (detectCanvas2D()) {
    preferred = 'WebGL2';
    selected = 'Canvas';
    fallbackReason = 'WebGL not supported, using Canvas 2D fallback with degraded features';
  }
  // No rendering capability available
  else {
    preferred = 'WebGL2';
    selected = 'None';
    fallbackReason = 'No rendering capability available (WebGL or Canvas)';
  }

  return { preferred, selected, fallbackReason };
}

/**
 * Checks if the selected capability meets minimum requirements.
 * Returns true if rendering can proceed, false if app should halt.
 */
export function meetsMinimumRequirements(capability: RendererCapability): boolean {
  // For now, we accept WebGL2, WebGL1, or Canvas (graceful degradation)
  // None means we must halt
  return capability !== 'None';
}
