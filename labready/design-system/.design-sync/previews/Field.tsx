import { Field } from '@labready/ui';

export const Text = () => <Field label="Analyte" placeholder="e.g. Glucose" />;
export const Filled = () => <Field label="Instrument / test system" defaultValue="Cobas Pure 1 (c303)" />;
export const DateField = () => <Field label="Date performed" type="date" defaultValue="2026-09-26" />;
export const Select = () => <Field label="Decision" type="select" defaultValue="Accepted" options={['Accepted', 'Accepted with conditions (see comments)', 'Not accepted: investigate']} />;
export const Textarea = () => <Field label="Corrective action taken" type="textarea" defaultValue="Opened fresh Level 3 vial, reran both levels." />;
export const Disabled = () => <Field label="Performed by" defaultValue="Leila Haddad" disabled />;
