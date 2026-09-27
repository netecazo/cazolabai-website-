import * as React from 'react';
import { cx } from './cx';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Status colour. `complete` green, `due` amber, `overdue` red, `scheduled` teal, `muted` grey, `not-competent` red. */
    status?: 'complete' | 'due' | 'overdue' | 'scheduled' | 'muted' | 'not-competent';
}

/** A small rounded status label (`.pill`), e.g. "Overdue 9 days", "Meets criteria", "Waiting". Always pair colour with words. */
export function Pill({ status = 'muted', className, children, ...rest }: PillProps) {
    return <span className={cx('pill', status, className)} {...rest}>{children}</span>;
}
