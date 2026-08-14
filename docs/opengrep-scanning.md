# OpenGrep Security Scanning

This repo runs [OpenGrep](https://github.com/opengrep/opengrep) — a static application
security testing (SAST) engine — on every pull request targeting `master` (this repo's
default branch), via `.github/workflows/opengrep.yml`.

## Why OpenGrep (not Semgrep)?

OpenGrep is an LGPL-2.1 fork of Semgrep OSS, created after Semgrep Inc. moved features
(and registry access) behind a commercial license. OpenGrep remains fully open-source and
rule-compatible with Semgrep, so it can consume the same public rule sources without
requiring a Semgrep account or login. There is no official OpenGrep GitHub Action, so the
workflow installs and drives the CLI directly.

## How the workflow works

1. Installs the pinned OpenGrep CLI release via the official install script, verified
   with Cosign signatures (`sigstore/cosign-installer`).
2. Sparse-clones [`semgrep/semgrep-rules`](https://github.com/semgrep/semgrep-rules)
   (Apache-2.0) at a pinned commit — the rule source is **not** vendored into this repo.
3. Runs `opengrep scan` against the whole repo using rule packs for:
   - `csharp/` — backend (`src/backend`)
   - `javascript/`, `typescript/` — frontend (`src/frontend`, covers `.jsx`/`.tsx` too)
   - `generic/secrets/` — hardcoded credential/token patterns, repo-wide
   - `generic/ci/` — GitHub Actions workflow security patterns
4. Uploads results as SARIF to the **Security → Code scanning** tab (category
   `opengrep`), plus a build artifact and a short job-summary count.

## Advisory-only (for now)

The job runs with `continue-on-error: true`, so findings are visible (Security tab, job
summary, artifact) but **never fail the PR check or block merge**. This is intentional
for the initial rollout while the team triages the first batch of findings. A first local
run against this repo (see below) found 34 findings across ~308 files/478 rules — a
manageable volume, though some (e.g. a JSX i18n-portability rule) are stylistic rather
than security-relevant. Future tightening options, none enabled yet:

- Add `--severity=ERROR` (repeatable) to `opengrep scan` to only fail on high-severity
  findings, and drop `continue-on-error` once the team is ready to gate merges.
- Add `--exclude-rule=<rule-id>` for specific low-value/noisy rules.
- Make the check a required status check in branch protection (a repo admin setting, not
  a file change).

> **Expect a finding on `.semgrepignore` itself the first time this runs.** One
> `generic/secrets` rule flags newly added `.semgrepignore` entries as a meta-check
> (catching attempts to silently hide vulnerable code from scanning). This is expected
> and can be dismissed once reviewed.

## Bumping pinned versions

Both the CLI version and the rules commit are pinned in `opengrep.yml`'s `env:` block
(`OPENGREP_VERSION`, `RULES_COMMIT`) for reproducibility. To bump:

1. Check the [OpenGrep releases page](https://github.com/opengrep/opengrep/releases) for
   the latest CLI version.
2. Check the [semgrep-rules commit history](https://github.com/semgrep/semgrep-rules/commits/develop)
   for a recent, stable commit.
3. Update both values, then re-run the workflow on a test PR before merging the bump.

## Running locally

```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/opengrep/opengrep/main/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/opengrep/opengrep/main/install.ps1 | iex
```

```bash
git clone --filter=blob:none --no-checkout https://github.com/semgrep/semgrep-rules.git /tmp/semgrep-rules
git -C /tmp/semgrep-rules sparse-checkout set csharp javascript typescript generic/secrets generic/ci
git -C /tmp/semgrep-rules checkout <RULES_COMMIT from opengrep.yml>

opengrep scan \
  --config /tmp/semgrep-rules/csharp \
  --config /tmp/semgrep-rules/javascript \
  --config /tmp/semgrep-rules/typescript \
  --config /tmp/semgrep-rules/generic/secrets \
  --config /tmp/semgrep-rules/generic/ci \
  .
```

> **Windows note:** any `opengrep` flag that writes output to a file (`--sarif-output`,
> `--json-output`, etc.) currently crashes on Windows with
> `AttributeError: module 'os' has no attribute 'O_NOFOLLOW'` — a POSIX-only API the CLI
> relies on. This does not affect the CI workflow (Linux runner). On Windows, omit
> `-output` flags and let results print to the console, or use `--sarif`/`--json` to print
> to stdout and redirect with PowerShell (e.g. `... . > results.sarif`).

## Relationship to `gh-aw` agentic workflows

`daily-repo-status.md` and `daily-doc-updater.md` in this directory use the
[`gh-aw`](https://github.com/github/gh-aw) runner for AI-agent-driven scheduled tasks
(compiled to companion `.lock.yml` files). OpenGrep scanning is deterministic tooling, not
an agent task, so it's a plain GitHub Actions workflow (`opengrep.yml`) like `ci.yml` —
there is no `.lock.yml` counterpart for it.
