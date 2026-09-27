import * as React from 'react';

export interface LogoProps {
    /** Where the logo links to. */
    href?: string;
}

/** The LabReady Pro wordmark: the teal-to-green "LR" tile and "LabReady Pro" with "Pro" in teal. */
export function Logo({ href = '/' }: LogoProps) {
    return (
        <a href={href} className="logo">
            <div className="logo-mark">LR</div>
            <span className="logo-text">LabReady <span>Pro</span></span>
        </a>
    );
}
