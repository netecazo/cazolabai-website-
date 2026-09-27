import * as React from 'react';
import { cx } from './cx';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {}

/** A dashed placeholder panel (`.empty`) for lists with nothing in them yet. Say what to do next, and include the button that does it. */
export function EmptyState({ className, children, ...rest }: EmptyStateProps) {
    return <div className={cx('empty', className)} {...rest}>{children}</div>;
}
