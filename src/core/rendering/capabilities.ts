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
 * Error information when rendering capabilities are insufficient
 */
export interface CapabilityError {
  /** Error code for programmatic handling */
  code: 'WEBGL_UNAVAILABLE' | 'NO_RENDERING_CAPABILITY';
  /** Technical message for logging */
  message: string;
  /** User-friendly message to display */
  userMessage: string;
  /** Suggestions for the user */
  suggestions: string[];
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
 *
 * Per FR-003: WebGL is required. Canvas fallback is not supported.
 */
export function meetsMinimumRequirements(capability: RendererCapability): boolean {
  // WebGL2 or WebGL1 required - Canvas and None mean we must halt
  return capability === 'WebGL2' || capability === 'WebGL1';
}

/**
 * Gets the capability error for a given renderer capability.
 * Returns null if the capability is sufficient (WebGL2 or WebGL1).
 *
 * Per SC-004: Present clear, actionable error message within 2 seconds when WebGL unavailable.
 */
export function getCapabilityError(capability: RendererCapability): CapabilityError | null {
  if (capability === 'WebGL2' || capability === 'WebGL1') {
    return null;
  }

  if (capability === 'Canvas') {
    return {
      code: 'WEBGL_UNAVAILABLE',
      message: 'WebGL not available, Canvas 2D detected but not supported',
      userMessage: 'Your browser does not support the required graphics capabilities (WebGL).',
      suggestions: [
        'Update your browser to the latest version',
        'Enable hardware acceleration in your browser settings',
        'Try a different browser (Chrome, Firefox, or Edge recommended)',
        'Check if your graphics drivers are up to date'
      ]
    };
  }

  return {
    code: 'NO_RENDERING_CAPABILITY',
    message: 'No rendering capability available (WebGL or Canvas)',
    userMessage: 'Your browser does not support any rendering capabilities required by this application.',
    suggestions: [
      'Use a modern web browser (Chrome, Firefox, Edge, or Safari)',
      'Enable JavaScript and hardware acceleration',
      'Check if your device has a compatible graphics processor'
    ]
  };
}
