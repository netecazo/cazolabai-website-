import * as React from 'react';

export interface ProgressProps {
    /** How many steps are done. */
    done: number;
    /** Total steps; competency records have six assessment methods. */
    total?: number;
    /** Accessible label. */
    label?: string;
}

/** A row of small squares showing steps done (`.progress`), used for "4 of 6 methods recorded". */
export function Progress({ done, total = 6, label }: ProgressProps) {
    return (
        <span className="progress" role="img" aria-label={label || done + ' of ' + total + ' done'}>
            {Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? 'on' : undefined} />)}
        </span>
    );
}
