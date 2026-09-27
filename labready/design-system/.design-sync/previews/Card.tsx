import { Card, Button } from '@labready/ui';

export const ToolCard = () => (
    <Card title="Acceptance criteria" hint="Enter the limits from your laboratory's procedure. LabReady doesn't set them.">
        <p>A result passes when its difference is within the larger of the two limits.</p>
    </Card>
);

export const AppFormCard = () => (
    <Card variant="form" title="Inspection packet" hint="Every signed-off competency record in the period, one per page.">
        <Button>Build packet</Button>
    </Card>
);
