import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of a visual comparison between two screenshots
 */
export interface ComparisonResult {
  /** Whether the images match within the specified threshold */
  match: boolean;
  /** Percentage of pixels that matched (0-100) */
  matchPercentage: number;
  /** Number of pixels that differed */
  diffPixelCount: number;
  /** Total number of pixels compared */
  totalPixels: number;
  /** Path to the generated diff image (if saveDiff was true) */
  diffImagePath?: string;
}

/**
 * Options for visual comparison
 */
export interface CompareOptions {
  /** Match threshold percentage (0-100, default: 95) */
  threshold?: number;
  /** Pixel matching threshold for pixelmatch (0-1, default: 0.1) */
  pixelThreshold?: number;
  /** Whether to save a diff image highlighting differences */
  saveDiff?: boolean;
  /** Path to save the diff image */
  diffOutputPath?: string;
}

/**
 * Compare two PNG images and return a comparison result
 *
 * @param baselinePath - Path to the baseline/reference image
 * @param currentPath - Path to the current/test image
 * @param options - Comparison options
 * @returns Comparison result with match status and statistics
 */
export async function compareScreenshots(
  baselinePath: string,
  currentPath: string,
  options: CompareOptions = {}
): Promise<ComparisonResult> {
  const {
    threshold = 95,
    pixelThreshold = 0.1,
    saveDiff = false,
    diffOutputPath
  } = options;

  // Read and parse the baseline image
  const baselineBuffer = fs.readFileSync(baselinePath);
  const baselinePng = PNG.sync.read(baselineBuffer);

  // Read and parse the current image
  const currentBuffer = fs.readFileSync(currentPath);
  const currentPng = PNG.sync.read(currentBuffer);

  // Validate dimensions match
  if (baselinePng.width !== currentPng.width || baselinePng.height !== currentPng.height) {
    return {
      match: false,
      matchPercentage: 0,
      diffPixelCount: baselinePng.width * baselinePng.height,
      totalPixels: baselinePng.width * baselinePng.height,
      diffImagePath: undefined
    };
  }

  const { width, height } = baselinePng;
  const totalPixels = width * height;

  // Create diff image buffer
  const diffPng = new PNG({ width, height });

  // Run pixel comparison
  const diffPixelCount = pixelmatch(
    baselinePng.data,
    currentPng.data,
    diffPng.data,
    width,
    height,
    { threshold: pixelThreshold }
  );

  const matchPercentage = ((totalPixels - diffPixelCount) / totalPixels) * 100;
  const match = matchPercentage >= threshold;

  let diffImagePath: string | undefined;

  // Save diff image if requested
  if (saveDiff && diffPixelCount > 0) {
    const outputPath = diffOutputPath || baselinePath.replace('.png', '-diff.png');
    fs.writeFileSync(outputPath, PNG.sync.write(diffPng));
    diffImagePath = outputPath;
  }

  return {
    match,
    matchPercentage,
    diffPixelCount,
    totalPixels,
    diffImagePath
  };
}

/**
 * Compare a screenshot buffer against a baseline file
 *
 * @param baselinePath - Path to the baseline/reference image
 * @param currentBuffer - Buffer containing the current screenshot PNG data
 * @param options - Comparison options
 * @returns Comparison result with match status and statistics
 */
export async function compareScreenshotBuffer(
  baselinePath: string,
  currentBuffer: Buffer,
  options: CompareOptions = {}
): Promise<ComparisonResult> {
  const {
    threshold = 95,
    pixelThreshold = 0.1,
    saveDiff = false,
    diffOutputPath
  } = options;

  // Read and parse the baseline image
  const baselineBuffer = fs.readFileSync(baselinePath);
  const baselinePng = PNG.sync.read(baselineBuffer);

  // Parse the current buffer
  const currentPng = PNG.sync.read(currentBuffer);

  // Validate dimensions match
  if (baselinePng.width !== currentPng.width || baselinePng.height !== currentPng.height) {
    return {
      match: false,
      matchPercentage: 0,
      diffPixelCount: baselinePng.width * baselinePng.height,
      totalPixels: baselinePng.width * baselinePng.height,
      diffImagePath: undefined
    };
  }

  const { width, height } = baselinePng;
  const totalPixels = width * height;

  // Create diff image buffer
  const diffPng = new PNG({ width, height });

  // Run pixel comparison
  const diffPixelCount = pixelmatch(
    baselinePng.data,
    currentPng.data,
    diffPng.data,
    width,
    height,
    { threshold: pixelThreshold }
  );

  const matchPercentage = ((totalPixels - diffPixelCount) / totalPixels) * 100;
  const match = matchPercentage >= threshold;

  let diffImagePath: string | undefined;

  // Save diff image if requested
  if (saveDiff && diffPixelCount > 0) {
    const outputPath = diffOutputPath || baselinePath.replace('.png', '-diff.png');
    fs.writeFileSync(outputPath, PNG.sync.write(diffPng));
    diffImagePath = outputPath;
  }

  return {
    match,
    matchPercentage,
    diffPixelCount,
    totalPixels,
    diffImagePath
  };
}

/**
 * Get the path to the baselines directory
 */
export function getBaselinesDir(): string {
  return path.join(__dirname, '..', '..', 'e2e', 'parity', 'baselines');
}

/**
 * Get the path to a specific baseline image
 */
export function getBaselinePath(name: string): string {
  return path.join(getBaselinesDir(), `${name}.png`);
}
