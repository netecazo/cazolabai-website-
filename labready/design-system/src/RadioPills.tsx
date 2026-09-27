import * as React from 'react';

export interface RadioPillsProps {
    /** Radio group name. */
    name: string;
    /** The choices, in order. */
    options: string[];
    /** The selected option. */
    value?: string;
    onChange?: (value: string) => void;
}

/** A single-choice row of pill-shaped radio buttons (`.radio-row`), e.g. the Westgard rule picker in the QC assistant. */
export function RadioPills({ name, options, value, onChange }: RadioPillsProps) {
    return (
        <div className="radio-row">
            {options.map(o => (
                <label key={o}>
                    <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange && onChange(o)} readOnly={!onChange} />
                    <span>{o}</span>
                </label>
            ))}
        </div>
    );
}
