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

## Specialized Agents & Skills

Validation logic is handled by specialized agents and skills — **not** duplicated here.

### Agents

- **`@bpmn-validator`** — Read-only. Validates BPMN docs against source. Rejects Camunda/Flowable content.
- **`@java-api-validator`** — Read-only. Validates Java code examples against source. Checks APIs, imports, signatures.
- **`@config-validator`** — Read-only. Validates configuration properties against source. Checks defaults, types, prefixes.
- **`@content-auditor`** — Read-only. Audits documentation coverage against source. Finds gaps, broken links, orphaned files.
- **`@docusaurus-validator`** — Read-only. Validates Docusaurus conventions. Checks frontmatter, sidebar, code blocks, MDX.
- **`@docs-writer`** — Docs editing agent. Use when creating or updating documentation pages.

### Skills

- **`bpmn-validation`** — BPMN attribute reference tables and validation checklist.
- **`java-api-reference`** — Activiti Java API reference. Modern API (`ProcessRuntime`, `TaskRuntime`), legacy engine services, delegates, payloads, testing.
- **`configuration-properties`** — Spring Boot property reference. `ActivitiProperties`, `AsyncExecutorProperties`, defaults, valid values.
- **`docusaurus-conventions`** — Docusaurus 3 site conventions. Frontmatter, sidebar, code block languages, MDX components, config.
- **`process-extensions`** — Process extension JSON sidecar format. Variable definitions, assignments, templates, mappings.

### When to Use What

| Task | Agent | Skill |
|------|-------|-------|
| Validating BPMN XML | `@bpmn-validator` | `bpmn-validation` |
| Validating Java examples | `@java-api-validator` | `java-api-reference` |
| Validating config properties | `@config-validator` | `configuration-properties` |
| Checking documentation coverage | `@content-auditor` | — |
| Validating Docusaurus conventions | `@docusaurus-validator` | `docusaurus-conventions` |
| Creating/updating docs | `@docs-writer` | Load relevant skills |
| Process extension JSON | `@docusaurus-validator` | `process-extensions` |
