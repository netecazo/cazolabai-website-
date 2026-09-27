import * as React from 'react';
import { cx } from './cx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style. `default` is the dark ink button, `primary` the green call to action,
     *  `ghost` a white outlined button, `danger` a white button with red text for destructive actions. */
    variant?: 'default' | 'primary' | 'ghost' | 'danger';
    /** `small` for buttons inside tables, cards and toolbars. */
    size?: 'default' | 'small';
    /** Render as a link (`<a class="btn">`) instead of a button. */
    href?: string;
}

/**
 * The LabReady button (`.btn`). Use `primary` once per view for the main action
 * (e.g. "Request a pilot", "New study"), `ghost` for secondary actions, `danger` for Delete.
 */
export function Button({ variant = 'default', size = 'default', href, className, children, type, ...rest }: ButtonProps) {
    const cls = cx('btn', variant !== 'default' && variant, size === 'small' && 'small', className);
    if (href) return <a className={cls} href={href}>{children}</a>;
    return <button type={type || 'button'} className={cls} {...rest}>{children}</button>;
}
