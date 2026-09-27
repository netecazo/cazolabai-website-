import { Button } from '@labready/ui';

export const Variants = () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="primary">Request a pilot</Button>
        <Button>Schedule competencies</Button>
        <Button variant="ghost">Export CSV</Button>
        <Button variant="danger">Delete</Button>
    </div>
);

export const Small = () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="small">Sign as Demo Supervisor</Button>
        <Button size="small" variant="ghost">Copy link</Button>
        <Button size="small" variant="danger">Delete</Button>
    </div>
);

export const AsLink = () => <Button href="#pilot" variant="primary">Start a 60-day pilot</Button>;
