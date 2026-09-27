import * as React from 'react';
import { cx } from './cx';

export interface TableProps {
    /** Column headings. */
    columns: React.ReactNode[];
    /** One array of cells per row. */
    rows: React.ReactNode[][];
    /** `list` is the app's record list (uppercase headings, row dividers, rounded border);
     *  `doc` is the bordered document table used in printed records and worksheets. */
    variant?: 'list' | 'doc';
    /** Optional caption above a `doc` table. */
    caption?: React.ReactNode;
    /** Called with the row index when a `list` row is clicked; rows get a pointer and hover state. */
    onRowClick?: (index: number) => void;
    className?: string;
}

/** A data table in either of LabReady's two table styles. Wrapped so it scrolls sideways on phones instead of overflowing. */
export function Table({ columns, rows, variant = 'list', caption, onRowClick, className }: TableProps) {
    return (
        <div className={variant === 'list' ? 'list-wrap' : 'table-wrap'}>
            <table className={cx(variant, className)}>
                {caption != null && <caption>{caption}</caption>}
                <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className={onRowClick ? 'clickable' : undefined} onClick={onRowClick ? () => onRowClick(i) : undefined}>
                            {r.map((c, j) => <td key={j}>{c}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
