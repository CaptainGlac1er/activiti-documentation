# AGENTS.md

## Repo Overview

Docusaurus 3 documentation site for Activiti workflow/BPM engine. Docs live in `docs/` as `.md` files with YAML frontmatter. The **Activiti source code** is a git submodule at `./Activiti` — always verify technical claims against it.

**No build runtime available.** There is no Node.js or Java on this system. You can read source code and verify correctness, but cannot run `npm`, build, or execute Java tests.

## Docs Structure

- `docs/` — all content; frontmatter includes `slug` for URL routing
- `sidebars.ts` — navigation structure (edit here to add/reorder pages)
- `docusaurus.config.ts` — site config; note `onBrokenLinks: 'warn'` (won't fail build)
- `src/css/custom.scss` — custom styling (SASS plugin enabled)

## Doc Conventions

- BPMN XML examples must include `xmlns:activiti="http://activiti.org/bpmn"` when using `activiti:` extensions
- No Camunda-specific content — this is Activiti-only
- No Flowable-specific content — this is Activiti-only
- Java code blocks must compile — verify types against the Activiti submodule
- Keep `activiti:` legacy attributes clearly distinguished from standard BPMN

## Verifying Docs Against Source

The `./Activiti` submodule is the source of truth.

Search broadly in `./Activiti` — don't assume a handler lives where the docs say it does.
