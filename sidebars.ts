import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Activiti Documentation
 * - Maximum 3 levels of nesting
 * - Logical grouping by topic
 * - Clear separation of concepts, guides, and API reference
 * - Collapsible categories with sensible defaults
 */
const sidebars: SidebarsConfig = {
  activitiDocsSidebar: [
    {
      type: 'doc',
      id: 'quickstart',
      label: 'Quick Start',
      className: 'hero-quickstart',
    },
    {
      type: 'doc',
      id: 'architecture/overview',
      label: 'Architecture',
    },
    {
      type: 'doc',
      id: 'configuration',
      label: 'Configuration',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'BPMN Elements',
      link: {type: 'doc', id: 'bpmn/index'},
      items: [
        {
          type: 'category',
          label: 'Tasks',
          link: {type: 'generated-index', title: 'Task Elements Overview'},
          items: [
            'bpmn/elements/user-task',
            'bpmn/elements/service-task',
            'bpmn/elements/send-task',
            'bpmn/elements/script-task',
            'bpmn/elements/receive-task',
            'bpmn/elements/business-rule-task',
            'bpmn/elements/call-activity',
            'bpmn/elements/manual-task',
            'bpmn/elements/sequence-flows',
            'bpmn/elements/data-objects',
          ],
        },
        {
          type: 'category',
          label: 'Events',
          link: {type: 'generated-index', title: 'Events Overview'},
          items: [
            'bpmn/events/index',
            'bpmn/events/start-event',
            'bpmn/events/intermediate-events',
            'bpmn/events/end-event',
            'bpmn/events/boundary-event',
            'bpmn/events/compensation-events',
            'bpmn/events/link-events',
          ],
        },
        {
          type: 'category',
          label: 'Gateways',
          link: {type: 'generated-index', title: 'Gateways Overview'},
          items: [
            'bpmn/gateways/index',
            'bpmn/gateways/exclusive-gateway',
            'bpmn/gateways/parallel-gateway',
            'bpmn/gateways/inclusive-gateway',
            'bpmn/gateways/event-gateway',
            'bpmn/gateways/complex-gateway',
          ],
        },
        {
          type: 'category',
          label: 'Subprocesses',
          link: {type: 'generated-index', title: 'Subprocesses Overview'},
          items: [
            'bpmn/subprocesses/index',
            'bpmn/subprocesses/regular-subprocess',
            'bpmn/subprocesses/event-subprocess',
            'bpmn/subprocesses/adhoc-subprocess',
            'bpmn/subprocesses/transaction',
          ],
        },
        {
          type: 'doc',
          id: 'bpmn/common-features',
          label: 'Common Features',
        },
        {
          type: 'category',
          label: 'Advanced BPMN',
          link: {type: 'generated-index', title: 'Advanced BPMN Overview'},
          items: [
            'bpmn/advanced/async-execution',
            'bpmn/advanced/multi-instance',
            'bpmn/advanced/task-listeners',
            'bpmn/advanced/execution-listeners',
            'bpmn/advanced/java-delegate',
            'bpmn/advanced/delegate-execution-api',
            'bpmn/advanced/delegate-task-api',
            'bpmn/advanced/variables',
            'bpmn/advanced/error-handling',
            'bpmn/advanced/process-extensions',
          ],
        },
        {
          type: 'category',
          label: 'Integration',
          link: {type: 'generated-index', title: 'Integration Overview'},
          items: [
            'bpmn/integration/index',
            'bpmn/integration/connectors',
            'bpmn/integration/jpa-process-variables',
          ],
        },
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Advanced Features',
      link: {type: 'doc', id: 'advanced/index'},
      items: [
        {
          type: 'category',
          label: 'Engine Events & Monitoring',
          link: {type: 'generated-index', title: 'Events and Monitoring Overview'},
          items: [
            'advanced/engine-event-system',
            'advanced/database-event-logging',
            'advanced/historic-variable-updates',
            'advanced/execution-debug-tree',
          ],
        },
        {
          type: 'category',
          label: 'Process Lifecycle Control',
          link: {type: 'generated-index', title: 'Lifecycle Control Overview'},
          items: [
            'advanced/process-instance-suspension',
            'advanced/create-then-start',
            'advanced/runtime-process-control',
            'advanced/task-delegation',
          ],
        },
        {
          type: 'category',
          label: 'Deployment & Configuration',
          link: {type: 'generated-index', title: 'Deployment Overview'},
          items: [
            'advanced/auto-deployment-modes',
            'advanced/deployment-builder',
            'advanced/model-api',
          ],
        },
        {
          type: 'category',
          label: 'Authorization & Identity',
          link: {type: 'generated-index', title: 'Authorization Overview'},
          items: [
            'advanced/process-definition-authorization',
            'advanced/process-identity-links',
          ],
        },
        {
          type: 'category',
          label: 'Engine Extensibility',
          link: {type: 'generated-index', title: 'Extensibility Overview'},
          items: [
            'advanced/custom-parse-handlers',
          ],
        },
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'API Reference',
      link: {type: 'doc', id: 'api-reference/overview'},
      items: [
        {
          type: 'category',
          label: 'Activiti API',
          link: {type: 'generated-index', title: 'Activiti API Overview'},
          items: [
            {
              type: 'autogenerated',
              dirName: 'api-reference/activiti-api',
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
              dirName: 'api-reference/core-common',
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
              dirName: 'api-reference/engine-api',
            },
          ],
        },
      ],
    },
    {
      type: 'doc',
      id: 'implementation-patterns',
      label: 'Implementation Patterns',
    },
    {
      type: 'doc',
      id: 'best-practices/overview',
      label: 'Best Practices',
    },
    {
      type: 'doc',
      id: 'troubleshooting/overview',
      label: 'Troubleshooting',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Examples',
      link: {type: 'generated-index', title: 'Complete Working Examples'},
      items: [
        {
          type: 'category',
          label: 'Order Management Workflow',
          link: {type: 'generated-index', title: 'Order Management Workflow'},
          items: [
            'examples/order-management-workflow/summary',
            'examples/order-management-workflow/main-process',
            'examples/order-management-workflow/payment-process',
            'examples/order-management-workflow/inventory-process',
            'examples/order-management-workflow/shipping-process',
            'examples/order-management-workflow/service-delegates',
            'examples/order-management-workflow/process-extensions',
            'examples/order-management-workflow/rest-api',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
