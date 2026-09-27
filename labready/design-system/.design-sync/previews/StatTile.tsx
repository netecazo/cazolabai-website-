import { StatTile } from '@labready/ui';

export const Overdue = () => <StatTile value={3} label="Overdue" tone="overdue" />;
export const DueSoon = () => <StatTile value={5} label="Due in 30 days" tone="due" />;
export const Completed = () => <StatTile value={14} label="Completed in last 12 months" tone="complete" />;
export const Neutral = () => <StatTile value={8} label="Active testing staff" />;
