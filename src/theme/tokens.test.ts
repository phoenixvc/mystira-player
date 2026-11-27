import { describe, expect, it } from 'vitest';
import { manorTheme } from './tokens';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

describe('Manor theme', () => {
  it('keeps text and controls readable on every authored surface', () => {
    for (const surface of [manorTheme.background, manorTheme.surface, manorTheme.overlay]) {
      expect(contrast(manorTheme.text, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(manorTheme.muted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(manorTheme.accent, surface)).toBeGreaterThanOrEqual(3);
    }
  });
});
