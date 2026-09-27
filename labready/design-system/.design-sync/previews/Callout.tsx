import { Callout } from '@labready/ui';

export const Info = () => <Callout tone="info" title="Before you touch anything">Protect patients first. Then investigate.</Callout>;
export const Warn = () => <Callout tone="warn" title="Don't rerun controls until they pass.">Repeating again and again hides the problem and isn't an investigation.</Callout>;
export const Danger = () => <Callout tone="danger" title="Hold patient results">Nothing from this run goes out until QC is acceptable.</Callout>;
