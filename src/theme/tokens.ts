import type { CSSProperties } from 'react';

/** A host can supply another palette without changing scene components. */
export type PlayerTheme = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  overlay: string;
  radius: string;
  glow: string;
};

export const manorTheme: PlayerTheme = {
  background: '#1a0d2e',
  surface: '#2a1a4a',
  text: '#f5e6d3',
  muted: '#d1c0df',
  accent: '#ffc17a',
  overlay: '#1a0d2e',
  radius: '1rem',
  glow: '0 0 20px rgba(232, 149, 74, 0.3)',
};

export function themeStyle(theme: PlayerTheme): CSSProperties {
  return {
    '--mp-bg': theme.background,
    '--mp-surface': theme.surface,
    '--mp-text': theme.text,
    '--mp-muted': theme.muted,
    '--mp-accent': theme.accent,
    '--mp-overlay': theme.overlay,
    '--mp-radius': theme.radius,
    '--mp-glow': theme.glow,
  } as CSSProperties;
}
