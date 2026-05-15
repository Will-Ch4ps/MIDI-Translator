/** Tokens centrais do design system MIDI Studio.
 *
 * Paleta dark-first, glass sutil, accent vibrante. Reaproveitada via CSS
 * vars (ver tokens.css) — referenciar TS quando precisar de cálculo.
 */

export const palette = {
  bg: '#0B0D12',
  surface: '#141821',
  elevated: '#1B2030',
  raised: '#222840',
  border: '#252B3D',
  borderStrong: '#323A55',
  textPrimary: '#F4F6FB',
  textSecondary: '#A8B0C7',
  textMuted: '#6F7790',
  accent: '#7C5CFF',
  accentSoft: '#9B83FF',
  accentGlow: 'rgba(124, 92, 255, 0.35)',
  cyan: '#4FD1E0',
  green: '#3EE6A8',
  amber: '#FFBC4A',
  red: '#FF6680',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  pill: '999px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

export const ease = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const duration = {
  fast: '120ms',
  base: '200ms',
  slow: '320ms',
} as const;

export const shadow = {
  raised: '0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 24px rgba(0, 0, 0, 0.45)',
  overlay: '0 24px 60px rgba(0, 0, 0, 0.6)',
  accent: '0 6px 24px rgba(124, 92, 255, 0.4)',
} as const;

export type Palette = typeof palette;
