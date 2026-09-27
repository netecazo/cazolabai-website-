import { RadioPills } from '@labready/ui';

export const RuleViolated = () => <RadioPills name="rule" value="2-2s" options={['1-2s', '1-3s', '2-2s', 'R-4s', '4-1s', '10x', 'Other']} />;
export const Direction = () => <RadioPills name="dir" value="High" options={['High', 'Low', 'Opposite directions', 'Mixed / unclear']} />;
