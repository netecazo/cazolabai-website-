import { PageHeader, Button } from '@labready/ui';

export const WithActions = () => (
    <PageHeader
        title="Studies"
        subtitle="Lot-to-lot, method comparison and AMR / calibration verification, saved to Demo Community Hospital."
        actions={<><Button variant="ghost">Export CSV</Button><Button variant="primary">New study</Button></>}
    />
);

export const TitleOnly = () => <PageHeader title="QC investigations" subtitle="QC failures worked through with the QC Troubleshooting Assistant." />;
