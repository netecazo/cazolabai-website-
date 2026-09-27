import { Modal, Field, Button } from '@labready/ui';

// The backdrop is position: fixed; the transformed box keeps it inside the card instead of the viewport.
export const SendQuizLink = () => (
    <div style={{ position: 'relative', height: 400, transform: 'translateZ(0)', overflow: 'hidden' }}>
    <Modal open title="Send a quiz link · Maria Alvarez" width={520}>
        <p style={{ marginBottom: '0.8rem', fontSize: '0.9rem' }}>Maria opens the link on a phone or computer, no account needed. Links expire after 14 days.</p>
        <Field label="Module" type="select" defaultValue="02. QC Failure Investigation" options={['01. QC Fundamentals & Westgard Rules', '02. QC Failure Investigation', '03. Calibration & Calibration Verification']} />
        <div style={{ marginTop: '1rem' }}><Button>Create link</Button></div>
    </Modal>
    </div>
);
