import * as React from 'react';
import { cx } from './cx';

export interface FieldProps {
    /** Label shown above the control. */
    label: React.ReactNode;
    /** Id linking the label and the control (generated when omitted). */
    id?: string;
    /** `text`, `date`, `time` and `number` render an input; `select` and `textarea` render those elements. */
    type?: 'text' | 'date' | 'time' | 'number' | 'select' | 'textarea';
    /** Options for `type="select"` (value/label pairs, or plain strings). */
    options?: Array<string | { value: string; label: string }>;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    /** Rows for `type="textarea"`. */
    rows?: number;
    disabled?: boolean;
    onChange?: (value: string) => void;
    /** Span both columns inside a FieldGrid. */
    full?: boolean;
    className?: string;
}

let seq = 0;

/** A labelled form control using LabReady's `.lbl` label and full-width input styling. Place several in a FieldGrid. */
export function Field({ label, id, type = 'text', options = [], value, defaultValue, placeholder, rows = 3, disabled, onChange, full, className }: FieldProps) {
    const [autoId] = React.useState(() => 'lr-field-' + (++seq));
    const fid = id || autoId;
    const common = {
        id: fid, value, defaultValue, disabled,
        onChange: onChange ? (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(e.target.value) : undefined
    };
    let control: React.ReactNode;
    if (type === 'select') {
        control = (
            <select {...common}>
                {options.map(o => typeof o === 'string'
                    ? <option key={o} value={o}>{o}</option>
                    : <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        );
    } else if (type === 'textarea') {
        control = <textarea {...common} rows={rows} placeholder={placeholder} />;
    } else {
        control = <input {...common} type={type} placeholder={placeholder} />;
    }
    return (
        <div className={cx(full && 'full', className)}>
            <label className="lbl" htmlFor={fid}>{label}</label>
            {control}
        </div>
    );
}

export interface FieldGridProps extends React.HTMLAttributes<HTMLDivElement> {}

/** Two-column grid for Fields (`.field-grid`); one column on phones. Give a Field `full` to span both. */
export function FieldGrid({ className, children, ...rest }: FieldGridProps) {
    return <div className={cx('field-grid', className)} {...rest}>{children}</div>;
}
