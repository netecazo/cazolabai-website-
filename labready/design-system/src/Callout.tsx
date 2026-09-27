import * as React from 'react';
import { cx } from './cx';

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** `info` (teal) for guidance, `warn` (amber) for cautions, `danger` (red) for anything that affects patient results. */
    tone?: 'info' | 'warn' | 'danger';
    /** Bold first line. */
    title?: React.ReactNode;
}

/** A tinted message box (`.callout`) for guidance, warnings and safety notes inside a card. */
export function Callout({ tone = 'info', title, className, children, ...rest }: CalloutProps) {
    return (
        <div className={cx('callout', tone, className)} {...rest}>
            {title != null && <b>{title}</b>}
            {children}
        </div>
    );
}
