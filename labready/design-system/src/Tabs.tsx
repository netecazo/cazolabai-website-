import * as React from 'react';

export interface TabsProps {
    /** The tabs, in order. `href` makes each a link. */
    items: Array<{ id: string; label: React.ReactNode; href?: string }>;
    /** Id of the active tab. */
    active?: string;
    onSelect?: (id: string) => void;
}

/** The app's top navigation tabs (`.tabs`): teal underline on the active tab, scrolls sideways on phones. */
export function Tabs({ items, active, onSelect }: TabsProps) {
    return (
        <nav className="tabs">
            {items.map(t => (
                <a key={t.id} href={t.href || '#'} className={t.id === active ? 'active' : undefined}
                    onClick={onSelect ? e => { if (!t.href) e.preventDefault(); onSelect(t.id); } : undefined}>
                    {t.label}
                </a>
            ))}
        </nav>
    );
}
