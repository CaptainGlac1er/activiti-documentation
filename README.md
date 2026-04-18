# Activiti Documentation

Comprehensive documentation for the [Activiti](https://github.com/Activiti/Activiti) workflow and BPM engine — covering the Activiti API, BPMN 2.0 elements, architecture, and integration patterns.

> **Community-built & AI-generated.** This documentation is independently maintained by the community and generated with AI assistance. It is not an official Alfresco or Activiti project artifact.

## What's Covered

- **BPMN 2.0 Reference** — Elements, events, gateways, subprocesses, and advanced features
- **API Reference** — Activiti API (Process, Task, Runtime), Core Common, and Engine API
- **Architecture** — Engine internals and design decisions
- **Advanced Topics** — Extensions, performance, operations, and implementation patterns
- **Best Practices** — Guidelines for building reliable workflows
- **Troubleshooting** — Common issues and resolutions
- **Examples** — Real-world workflow examples

## Tech Stack

- [Docusaurus 3](https://docusaurus.io/) — Static site generator
- TypeScript + SCSS — Frontend tooling
- Mermaid — Diagrams
- Local Search — Built-in documentation search

## Getting Started

### Prerequisites

- Node.js >= 20.0

### Installation

```bash
npm ci
```

### Local Development

```bash
npm run start
```

Starts the dev server at `http://localhost:3000`. Changes are reflected live.

### Build

```bash
npm run build
```

Generates static site in the `build/` directory.

## Source of Truth

This documentation is cross-referenced against the [Activiti source code](./Activiti/) (git submodule, version 8.7.1). When discrepancies arise, the source code is authoritative.

## Contributing

Contributions are welcome. Please ensure:

- Documentation is verified against the Activiti source submodule
- BPMN examples match test BPMN files in the Activiti folder
- No Camunda-specific content is included

## License

This documentation project is licensed under the [Apache License 2.0](LICENSE.md).
