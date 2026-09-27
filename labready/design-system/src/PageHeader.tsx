import * as React from 'react';

export interface PageHeaderProps {
    /** Page title (h1). */
    title: React.ReactNode;
    /** Muted line under the title. */
    subtitle?: React.ReactNode;
    /** Buttons aligned to the right (they wrap below the title on phones). */
    actions?: React.ReactNode;
}

/** The title row at the top of an app view (`.view-head`): h1, a short subtitle and right-aligned actions. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="view-head">
            <div>
                <h1>{title}</h1>
                {subtitle != null && <p>{subtitle}</p>}
            </div>
            {actions != null && <div className="actions">{actions}</div>}
        </div>
    );
}
