import { Progress } from '@labready/ui';

const Row = ({ n }: { n: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
        <Progress done={n} /> <span>{n} of 6 methods recorded</span>
    </div>
);

export const None = () => <Row n={0} />;
export const Partway = () => <Row n={4} />;
export const Complete = () => <Row n={6} />;
