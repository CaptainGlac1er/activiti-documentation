import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Activiti Documentation
 *
 * The docs site is organized into modules, each living in its own folder
 * under `docs/` and exposed as its own sidebar (one `<module>Sidebar` per
 * module). The root `docs/index.md` acts as the module hub landing page and
 * is excluded from sidebars automatically.
 *
 * To add a new module (e.g. Activiti Cloud):
 *   1. Create `docs/cloud/` and add its content
 *   2. Add a `cloudSidebar` here referencing its doc ids (`cloud/...`)
 *   3. Add a navbar `docSidebar` item for it in `docusaurus.config.ts`
 *   4. Add a section for it in `docs/index.md`
 *
 * Per-module conventions:
 * - Organized around user journey: learn -> configure -> reference -> go deeper
 * - Maximum 3 levels of nesting
 * - Collapsible categories with sensible defaults
 */
const sidebars: SidebarsConfig = {
  // ---------------------------------------------------------------------------
  // Module: Activiti Cloud (microservices platform: runtime bundle, query,
  // audit, messages, GraphQL, connectors, deployment)
  // Content lives in docs/cloud/
  // ---------------------------------------------------------------------------
  cloudSidebar: [
    {
      type: 'doc',
      id: 'cloud/index',
      label: 'Activiti Cloud',
      className: 'hero-quickstart',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: false,
      label: 'Getting Started',
      link: {type: 'doc', id: 'cloud/getting-started/overview'},
      items: [
        'cloud/getting-started/local-setup',
        'cloud/getting-started/first-workflow',
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Architecture',
      link: {type: 'doc', id: 'cloud/architecture/overview'},
      items: [
        'cloud/architecture/event-driven',
        'cloud/architecture/identity',
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Services',
      link: {type: 'generated-index', title: 'Services Overview'},
      items: [
        'cloud/services/runtime-bundle',
        'cloud/services/query',
        'cloud/services/audit',
        'cloud/services/messages',
        'cloud/services/notifications-graphql',
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Connectors',
      link: {type: 'doc', id: 'cloud/connectors/overview'},
      items: [
        'cloud/connectors/inbound',
        'cloud/connectors/outbound',
      ],
    },
    {
      type: 'doc',
      id: 'cloud/deployment/reference',
      label: 'Deployment Reference',
    },
    {
      type: 'doc',
      id: 'cloud/examples/end-to-end',
      label: 'End-to-End Example',
    },
  ],
  // ---------------------------------------------------------------------------
  // Module: Activiti (engine API, BPMN reference, advanced topics)
  // Content lives in docs/activiti/
  // ---------------------------------------------------------------------------
  activitiSidebar: [
    {
      type: 'doc',
      id: 'activiti/index',
      label: 'Activiti',
      className: 'hero-quickstart',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: false,
      label: 'Getting Started',
      link: {type: 'doc', id: 'activiti/getting-started/overview'},
      items: [
        'activiti/quickstart',
        {
          type: 'doc',
          id: 'activiti/architecture/overview',
          label: 'Architecture Overview',
        },
      ],
    },
    {
      type: 'doc',
      id: 'activiti/configuration',
      label: 'Engine Configuration',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'BPMN Reference',
      link: {type: 'doc', id: 'activiti/bpmn/index'},
      items: [
        {
          type: 'category',
          label: 'Tasks',
          link: {type: 'generated-index', title: 'Task Elements Overview'},
          items: [
            'activiti/bpmn/elements/user-task',
            'activiti/bpmn/elements/service-task',
            'activiti/bpmn/elements/send-task',
            'activiti/bpmn/elements/script-task',
            'activiti/bpmn/elements/receive-task',
            'activiti/bpmn/elements/business-rule-task',
            'activiti/bpmn/elements/call-activity',
            'activiti/bpmn/elements/manual-task',
            'activiti/bpmn/elements/shell-task',
            'activiti/bpmn/elements/sequence-flows',
            'activiti/bpmn/elements/data-objects',
            'activiti/bpmn/elements/data-grid',
            'activiti/bpmn/elements/pools-lanes',
          ],
        },
        {
          type: 'category',
          label: 'Events',
          link: {type: 'doc', id: 'activiti/bpmn/events/index'},
          items: [
            'activiti/bpmn/events/start-event',
            'activiti/bpmn/events/intermediate-events',
            'activiti/bpmn/events/end-event',
            'activiti/bpmn/events/boundary-event',
            'activiti/bpmn/events/compensation-events',
            'activiti/bpmn/events/link-events',
          ],
        },
        {
          type: 'category',
          label: 'Gateways',
          link: {type: 'doc', id: 'activiti/bpmn/gateways/index'},
          items: [
            'activiti/bpmn/gateways/exclusive-gateway',
            'activiti/bpmn/gateways/parallel-gateway',
            'activiti/bpmn/gateways/inclusive-gateway',
            'activiti/bpmn/gateways/event-gateway',
            'activiti/bpmn/gateways/complex-gateway',
          ],
        },
        {
          type: 'category',
          label: 'Subprocesses',
          link: {type: 'doc', id: 'activiti/bpmn/subprocesses/index'},
          items: [
            'activiti/bpmn/subprocesses/regular-subprocess',
            'activiti/bpmn/subprocesses/event-subprocess',
            'activiti/bpmn/subprocesses/adhoc-subprocess',
            'activiti/bpmn/subprocesses/transaction',
          ],
        },
        {
          type: 'doc',
          id: 'activiti/bpmn/common-features',
          label: 'Common Features',
        },
        {
          type: 'category',
          label: 'Advanced BPMN',
          link: {type: 'generated-index', title: 'Advanced BPMN Overview'},
          items: [
            'activiti/bpmn/reference/async-execution',
            'activiti/bpmn/reference/multi-instance',
            'activiti/bpmn/reference/task-listeners',
            'activiti/bpmn/reference/execution-listeners',
            'activiti/bpmn/reference/process-event-listeners',
            'activiti/bpmn/reference/java-delegate',
            'activiti/bpmn/reference/delegate-execution-api',
            'activiti/bpmn/reference/delegate-task-api',
            'activiti/bpmn/reference/variables',
            'activiti/bpmn/reference/error-handling',
            'activiti/bpmn/reference/process-extensions',
            'activiti/bpmn/reference/business-calendars',
          ],
        },
        {
          type: 'category',
          label: 'Integration',
          link: {type: 'doc', id: 'activiti/bpmn/integration/index'},
          items: [
            'activiti/bpmn/integration/connectors',
            'activiti/bpmn/integration/spring-integration',
            'activiti/bpmn/integration/jpa-process-variables',
          ],
        },
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Advanced Topics',
      link: {type: 'doc', id: 'activiti/advanced/index'},
      items: [
        {
          type: 'category',
          label: 'Engine Events & Monitoring',
          link: {type: 'generated-index', title: 'Events and Monitoring Overview'},
          items: [
            'activiti/advanced/engine-event-system',
            'activiti/advanced/database-event-logging',
            'activiti/advanced/historic-variable-updates',
            'activiti/advanced/execution-debug-tree',
            'activiti/advanced/token-lifecycle',
            'activiti/advanced/event-subscription-querying',
          ],
        },
        {
          type: 'category',
          label: 'Process Lifecycle Control',
          link: {type: 'generated-index', title: 'Lifecycle Control Overview'},
          items: [
            'activiti/advanced/process-instance-suspension',
            'activiti/advanced/create-then-start',
            'activiti/advanced/runtime-process-control',
            'activiti/advanced/task-delegation',
          ],
        },
        {
          type: 'category',
          label: 'Deployment & Configuration',
          link: {type: 'generated-index', title: 'Deployment Overview'},
          items: [
            'activiti/advanced/auto-deployment-modes',
            'activiti/advanced/deployment-builder',
            'activiti/advanced/model-api',
          ],
        },
        {
          type: 'category',
          label: 'Authorization & Security',
          link: {type: 'generated-index', title: 'Authorization Overview'},
          items: [
            'activiti/advanced/process-definition-authorization',
            'activiti/advanced/process-identity-links',
            'activiti/advanced/security-policies',
          ],
        },
        {
          type: 'category',
          label: 'Operations & Administration',
          link: {type: 'generated-index', title: 'Operations Overview'},
          items: [
            'activiti/advanced/database-schema',
            'activiti/advanced/management-service',
            'activiti/advanced/job-lifecycle',
            'activiti/advanced/multi-tenancy',
            'activiti/advanced/native-queries',
            'activiti/advanced/optimistic-locking',
            'activiti/advanced/history-cleanup',
          ],
        },
        {
          type: 'category',
          label: 'Engine Extensibility',
          link: {type: 'generated-index', title: 'Extensibility Overview'},
          items: [
            'activiti/advanced/custom-parse-handlers',
            'activiti/advanced/testing-infrastructure',
            'activiti/advanced/custom-validators',
          ],
        },
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'API Reference',
      link: {type: 'doc', id: 'activiti/api-reference/overview'},
      items: [
        {
          type: 'category',
          label: 'Activiti API',
          link: {type: 'generated-index', title: 'Activiti API Overview'},
          items: [
            {
              type: 'autogenerated',
              dirName: 'activiti/api-reference/activiti-api',
            },
          ],
        },
        {
          type: 'category',
          label: 'Core Common',
          link: {type: 'generated-index', title: 'Core Common Overview'},
          items: [
            {
              type: 'autogenerated',
              dirName: 'activiti/api-reference/core-common',
            },
          ],
        },
        {
          type: 'category',
          label: 'Engine API',
          link: {type: 'generated-index', title: 'Engine API Overview'},
          items: [
            {
              type: 'autogenerated',
              dirName: 'activiti/api-reference/engine-api',
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Best Practices & Patterns',
      link: {type: 'doc', id: 'activiti/best-practices/index'},
      items: [
        'activiti/best-practices/guide',
        'activiti/implementation-patterns',
      ],
    },
    {
      type: 'doc',
      id: 'activiti/troubleshooting/overview',
      label: 'Troubleshooting',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Examples',
      link: {type: 'doc', id: 'activiti/examples/overview'},
      items: [
        {
          type: 'category',
          label: 'Order Management Workflow',
          link: {type: 'doc', id: 'activiti/examples/order-management-workflow/summary'},
          items: [
            'activiti/examples/order-management-workflow/main-process',
            'activiti/examples/order-management-workflow/payment-process',
            'activiti/examples/order-management-workflow/inventory-process',
            'activiti/examples/order-management-workflow/shipping-process',
            'activiti/examples/order-management-workflow/service-delegates',
            'activiti/examples/order-management-workflow/process-extensions',
            'activiti/examples/order-management-workflow/rest-api',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
