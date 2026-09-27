import * as React from 'react';
import { cx } from './cx';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Card heading (rendered as an h2). */
    title?: React.ReactNode;
    /** One-line muted explanation under the title. */
    hint?: React.ReactNode;
    /** `card` is the rounded white panel used on tool pages; `form` is the tighter app panel (`.form-card`). */
    variant?: 'card' | 'form';
}

/** A white rounded panel with an optional title and hint. The basic container for every LabReady page section. */
export function Card({ title, hint, variant = 'card', className, children, ...rest }: CardProps) {
    return (
        <div className={cx(variant === 'form' ? 'form-card' : 'card', className)} {...rest}>
            {title != null && <h2>{title}</h2>}
            {hint != null && (variant === 'form' ? <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '0.8rem' }}>{hint}</p> : <p className="hint">{hint}</p>)}
            {children}
        </div>
    );
}
