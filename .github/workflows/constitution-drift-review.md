---
name: Constitution Drift Review
description: Reviews recent merged changes for drift between the implementation, Spec-Kit constitution, and repo guidance, then records findings in a tracked maintenance issue.
on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

tracker-id: constitution-drift-review
strict: true

network:
  allowed:
    - defaults
    - github

safe-outputs:
  create-issue:
    title-prefix: "[constitution] "
    labels: [governance, maintenance]
    close-older-issues: true

tools:
  github:
    mode: gh-proxy
    toolsets: [default]

timeout-minutes: 45
---

# Constitution Drift Review

## Task

Review changes merged into the default branch during the last 24 hours and determine whether they create drift across:

- the current implementation
- .specify/memory/constitution.md
- .github/copilot-instructions.md
- .github/instructions/**/*.instructions.md

The workflow must treat the constitution as the durable source of project intent, not as something to update automatically because code changed. A change only qualifies as a constitutional update when it clearly represents an intentional, durable shift in the project's architecture, standards, or governance.

## Required context

Before concluding whether drift exists, read and compare:

- .specify/memory/constitution.md
- .github/copilot-instructions.md
- .github/instructions/**/*.instructions.md
- merged pull requests from the default branch in the last 24 hours
- the changed files and diff for any PRs that affect architecture, testing, UX, performance, auth, operational visibility, security, or developer guidance

## Process

1. Gather merged PRs from the last 24 hours for the repository default branch.
2. For each significant PR, inspect the title, description, changed files, and relevant diff to identify whether it affects project principles or guidance.
3. Compare the merged implementation against the guidance hierarchy:
   - Constitution → Copilot instructions
   - Constitution → implementation
   - Scoped instruction drift
   - Implementation → constitution (only if evidence shows an intentional principle change)
4. Classify each finding as one of the following:
   - conforms to constitution
   - instruction drift that needs a repo guidance update
   - implementation drift requiring human review
   - intentional constitutional evolution
   - no material drift
5. If no significant drift or governance issue is found, call `noop` with a brief reason instead of creating output.
6. If a real drift or policy gap is found, create a GitHub issue summarizing:
   - the merged PR(s) involved
   - affected guidance or implementation files
   - the drift classification
   - recommended follow-up action
   - evidence links to the constitution and relevant guidance files

## Guardrails

- Do not modify .specify/memory/constitution.md automatically.
- Do not assume code changes override the constitution.
- Only update the constitution when the merged change clearly represents an intentional and durable project decision.
- If intent is unclear, flag the discrepancy for human review instead of rewriting the constitution.
- Prefer evidence from the repository and merged pull request context over assumptions.

## Output behavior

- Create an issue only when there is material drift or a governance recommendation.
- Use `noop` when no relevant change or policy drift is found.
- Keep the issue concise, evidence-based, and action-oriented.
- If the workflow remains aligned, report that in a no-op summary rather than creating noise.
