import { Pill } from '@labready/ui';

export const Statuses = () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Pill status="overdue">Overdue 9 days</Pill>
        <Pill status="due">Due in 12 days</Pill>
        <Pill status="scheduled">Scheduled</Pill>
        <Pill status="complete">Complete</Pill>
        <Pill status="not-competent">Not competent</Pill>
        <Pill status="muted">Cancelled</Pill>
    </div>
);

export const Verdicts = () => (
    <div style={{ display: 'flex', gap: 8 }}>
        <Pill status="complete">Meets criteria</Pill>
        <Pill status="overdue">Does not meet</Pill>
        <Pill status="scheduled">Not yet judged</Pill>
    </div>
);
