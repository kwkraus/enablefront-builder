# Series Details UI Contract

The existing series detail route renders a `Series Details` section before metrics.

## Edit-capable user

- Empty value: show a neutral, keyboard-accessible “Add details” affordance; do not show an
  always-open editor.
- Non-empty value: show sanitized read-only content plus an edit affordance.
- Edit mode: expose labeled controls for bold, italic, underline, and bulleted list; support
  keyboard focus/activation, save, cancel, and visible saving state.
- Save failure: retain the draft and show the existing inline error banner pattern.
- Over-limit input: show an actionable validation message before persistence.

## Read-only user

- Render sanitized supported formatting read-only.
- Do not show an empty editor or add-details prompt when no details exist.

The component must use semantic markup, visible focus, readable contrast, and no client-side
permission assumptions beyond the existing series access result.
