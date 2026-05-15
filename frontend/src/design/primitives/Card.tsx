import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import './Card.css';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'surface' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  glow?: boolean;
};

export function Card({
  variant = 'elevated',
  padding = 'md',
  interactive,
  glow,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        'ui-card',
        `ui-card--${variant}`,
        `ui-card--p-${padding}`,
        interactive && 'ui-card--interactive',
        glow && 'ui-card--glow',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="ui-card__header">{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="ui-card__title">{children}</h3>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="ui-card__desc">{children}</p>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="ui-card__footer">{children}</div>;
}
