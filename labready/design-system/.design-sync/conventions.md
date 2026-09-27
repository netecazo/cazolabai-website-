# LabReady Pro: how to build with this design system

LabReady Pro is competency, QC and study-record software for clinical laboratories. Screens are calm, dense, printable records: white panels on a pale blue-grey page, teal for navigation and links, green only for the one main action.

## Setup

No provider or wrapper is needed. The components are plain React that render LabReady's own CSS classes; the look comes entirely from `styles.css` (the site's `labready.css` + `app.css`). Font is the system UI stack (`-apple-system, Segoe UI, Roboto, ...`), so there are no webfonts to load. Put page content inside `<main className="container">` (max-width 1100px, 16px side padding).

## Styling idiom: CSS classes + CSS custom properties

Style your own layout glue with the design system's existing classes and `var(--*)` tokens, never new colours.

| Token | Use |
|---|---|
| `--ink` | body text, default buttons |
| `--slate` / `--muted` | secondary text / hints and labels |
| `--line` | borders and dividers |
| `--bg` / `--card` | page background / panel background |
| `--brand` / `--brand-soft` | teal: links, active tabs, info tint |
| `--accent` / `--accent-dark` | green: the primary action, "complete", "pass" |
| `--warn` / `--warn-soft` | amber: due soon, cautions |
| `--danger` / `--danger-soft` | red: overdue, fail, destructive |

Layout classes you can use directly: `container`, `card`, `form-card`, `field-grid` (2 columns, `full` spans both), `actions` (a wrapping button row), `muted`, `callout info|warn|danger`, `table-wrap` / `list-wrap` (sideways scroll on phones), `empty`.

## Components

`Button` (variant `default | primary | ghost | danger`, size `small`, `href` makes a link), `Card` (`title`, `hint`, variant `card | form`), `Callout`, `Pill` (status `complete | due | overdue | scheduled | muted | not-competent`), `StatTile` + `StatGrid`, `Field` + `FieldGrid`, `RadioPills`, `Table` (variant `list` for record lists, `doc` for printed records), `EmptyState`, `Progress` (six assessment methods), `PageHeader`, `Tabs`, `Logo`, `Modal`. Read each component's `.prompt.md` and `.d.ts` before using it; the full stylesheet is `styles.css` and its import `_ds_bundle.css`.

Rules the product follows: one `primary` button per view; status is always words plus colour (a Pill says "Overdue 9 days", not just red); never show patient identifiers, only staff names, sample numbers and lot numbers; British spelling in copy.

## Example

```jsx
const { PageHeader, Button, StatGrid, StatTile, Table, Pill, Progress } = window.LabReadyUI;

<main className="container">
  <PageHeader title="Core Lab Chemistry" subtitle="Competency status across your laboratory"
    actions={<><Button variant="ghost">Export CSV</Button><Button variant="primary">Schedule competencies</Button></>} />
  <StatGrid>
    <StatTile value={3} label="Overdue" tone="overdue" />
    <StatTile value={5} label="Due in 30 days" tone="due" />
    <StatTile value={14} label="Completed in last 12 months" tone="complete" />
    <StatTile value={8} label="Active testing staff" />
  </StatGrid>
  <Table columns={['Staff', 'Test system', 'Progress', 'Status']}
    rows={[['Maria Alvarez', 'General chemistry', <Progress done={4} />, <Pill status="overdue">Overdue 9 days</Pill>]]} />
</main>
```
