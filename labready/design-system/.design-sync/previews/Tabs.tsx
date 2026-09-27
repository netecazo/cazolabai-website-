import { Tabs } from '@labready/ui';

export const AppTabs = () => (
    <Tabs
        active="studies"
        items={[
            { id: 'dashboard', label: 'Dashboard' }, { id: 'staff', label: 'Staff' }, { id: 'systems', label: 'Test systems' },
            { id: 'schedule', label: 'Schedule' }, { id: 'studies', label: 'Studies' }, { id: 'qc', label: 'QC' },
            { id: 'reports', label: 'Reports' }, { id: 'settings', label: 'Settings' }
        ]}
    />
);
