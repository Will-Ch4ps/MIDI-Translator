import type { ReactNode } from 'react';
import clsx from 'clsx';
import './Badge.css';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({
  children,
  tone = 'neutral',
  icon,
  size = 'md',
}: {
  children?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}) {
  return (
    <span className={clsx('ui-badge', `ui-badge--${tone}`, `ui-badge--${size}`)}>
      {icon ? <span className="ui-badge__icon">{icon}</span> : null}
      {children}
    </span>
  );
}
