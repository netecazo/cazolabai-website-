import { EmptyState, Button } from '@labready/ui';

export const NoStudies = () => (
    <EmptyState>
        <p style={{ marginBottom: '1rem' }}>No studies yet. Choose a type and click New study, then paste your results into the worksheet.</p>
        <Button variant="primary">New study</Button>
    </EmptyState>
);
