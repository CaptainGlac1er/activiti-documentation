# AGENTS.md

## Repo Overview

Docusaurus 3 documentation site for Activiti workflow/BPM engine. Docs live in `docs/` as `.md` files with YAML frontmatter.

**Runtime availability.** Node.js 22 (via nvm) and the project's dependencies are available on this machine — `npm start`, `npm run build`, `npm run typecheck`, and `npm test` all work. There is no Java runtime, so Java examples in the docs must be verified by reading source, not compiling.

**Tests.** `npm test` runs vitest over `src/theme/CodeBlock/bpmnLayout.test.ts` (jsdom environment; covers `extractActivitiProperties`, the detection logic behind the BPMN diagram property indicators) and `src/theme/CodeBlock/activitiInspector.test.ts` (the bpmn-js plugin module that renders the badges; also runs the real viewer in jsdom with SVG geometry stubs). `npm run typecheck` currently reports three pre-existing errors (`DirectoryTree/FileIcon.tsx` x2, `theme/Mermaid/index.tsx`) plus a tsconfig `baseUrl` deprecation — treat those as the baseline, not regressions.

## Docs Structure

The site is organized into **modules** — each module is a top-level folder under `docs/` with its own sidebar.

- `docs/` — module folders; frontmatter includes `slug` for URL routing (slugs are absolute, so moving files between folders does not change URLs)
  - `docs/activiti/` — Activiti engine module (API, BPMN reference, advanced topics)
  - `docs/index.md` — module hub landing page at `/docs/` (root index is auto-excluded from sidebars)
- `sidebars.ts` — one sidebar per module, named `<module>Sidebar` (e.g. `activitiSidebar`); doc ids are prefixed with the module folder (e.g. `activiti/quickstart`)
- `docusaurus.config.ts` — site config; one `docSidebar` navbar item per module; note `onBrokenLinks: 'warn'` (won't fail build)
- `src/css/custom.scss` — custom styling (SASS plugin enabled)

### Adding a new module (e.g. Activiti Cloud)

1. Create `docs/<module>/` with its content
2. Add a `<module>Sidebar` to `sidebars.ts` (doc ids prefixed `<module>/`)
3. Add a `docSidebar` navbar item for it in `docusaurus.config.ts`
4. Add a section for it in `docs/index.md`

## Doc Conventions

- BPMN XML examples must include `xmlns:activiti="http://activiti.org/bpmn"` when using `activiti:` extensions
- No Camunda-specific content — this is Activiti-only
- No Flowable-specific content — this is Activiti-only
- Java code blocks must compile — verify types against the Activiti submodule
- Keep `activiti:` legacy attributes clearly distinguished from standard BPMN

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
