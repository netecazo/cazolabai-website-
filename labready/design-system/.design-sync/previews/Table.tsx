import { Table, Pill, Progress } from '@labready/ui';

export const RecordList = () => (
    <Table
        columns={['Staff', 'Test system', 'Due', 'Progress', 'Status']}
        rows={[
            ['Maria Alvarez', 'General chemistry', 'Sep 17, 2026', <Progress done={4} />, <Pill status="overdue">Overdue 9 days</Pill>],
            ['James Chen', 'Immunoassay', 'Oct 23, 2026', <Progress done={0} />, <Pill status="due">Due in 27 days</Pill>],
            ['Ruth Okafor', 'General chemistry', 'Nov 30, 2026', <Progress done={2} />, <Pill status="scheduled">Scheduled</Pill>]
        ]}
        onRowClick={() => {}}
    />
);

export const DocTable = () => (
    <Table
        variant="doc"
        caption="Bias at decision levels (Deming)"
        columns={['Decision level', 'Predicted', 'Bias', 'Bias %', 'Allowed ±', 'Result']}
        rows={[
            ['1', '1.053', '+0.053', '+5.35%', '0.100', 'Pass'],
            ['4', '4.162', '+0.162', '+4.05%', '0.300', 'Pass']
        ]}
    />
);
