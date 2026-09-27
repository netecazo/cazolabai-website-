import { StatGrid, StatTile } from '@labready/ui';

export const Dashboard = () => (
    <StatGrid>
        <StatTile value={3} label="Overdue" tone="overdue" />
        <StatTile value={5} label="Due in 30 days" tone="due" />
        <StatTile value={14} label="Completed in last 12 months" tone="complete" />
        <StatTile value={8} label="Active testing staff" />
    </StatGrid>
);
