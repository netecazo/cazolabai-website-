import { FieldGrid, Field } from '@labready/ui';

export const StudyDetails = () => (
    <FieldGrid>
        <Field label="Analyte" defaultValue="Glucose" />
        <Field label="Units" defaultValue="mg/dL" />
        <Field label="Current lot number" defaultValue="Lot 481" />
        <Field label="New lot number" defaultValue="Lot 512" />
        <Field label="QC on the new lot" full defaultValue="Both QC levels within range on the new lot" />
    </FieldGrid>
);
