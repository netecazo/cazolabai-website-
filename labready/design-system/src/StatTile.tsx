import * as React from 'react';
import { cx } from './cx';

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The headline number. */
    value: React.ReactNode;
    /** What the number counts. */
    label: React.ReactNode;
    /** Colours the number: `overdue` red, `due` amber, `complete` green; omit for ink. */
    tone?: 'overdue' | 'due' | 'complete';
}

/** One headline number with a label (`.stat-tile`). Put three or four inside a StatGrid at the top of a dashboard. */
export function StatTile({ value, label, tone, className, ...rest }: StatTileProps) {
    return (
        <div className={cx('stat-tile', tone, className)} {...rest}>
            <b>{value}</b>
            <span>{label}</span>
        </div>
    );
}

export interface StatGridProps extends React.HTMLAttributes<HTMLDivElement> {}

/** A four-column row of StatTiles (`.stats`); wraps to two columns on phones. */
export function StatGrid({ className, children, ...rest }: StatGridProps) {
    return <div className={cx('stats', className)} {...rest}>{children}</div>;
}
