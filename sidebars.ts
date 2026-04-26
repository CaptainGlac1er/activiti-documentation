import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Activiti Documentation
 * - Organized around user journey: learn -> configure -> reference -> go deeper
 * - Maximum 3 levels of nesting
 * - Collapsible categories with sensible defaults
 */
const sidebars: SidebarsConfig = {
  activitiDocsSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Documentation',
      className: 'hero-quickstart',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: false,
      label: 'Getting Started',
      link: {type: 'doc', id: 'getting-started/overview'},
      items: [
        'quickstart',
        {
          type: 'doc',
          id: 'architecture/overview',
          label: 'Architecture Overview',
        },
      ],
    },
    {
      type: 'doc',
      id: 'configuration',
      label: 'Engine Configuration',
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'BPMN Reference',
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
          link: {type: 'doc', id: 'bpmn/events/index'},
          items: [
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
          link: {type: 'doc', id: 'bpmn/gateways/index'},
          items: [
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
          link: {type: 'doc', id: 'bpmn/subprocesses/index'},
          items: [
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
            'bpmn/reference/async-execution',
            'bpmn/reference/multi-instance',
            'bpmn/reference/task-listeners',
            'bpmn/reference/execution-listeners',
            'bpmn/reference/java-delegate',
            'bpmn/reference/delegate-execution-api',
            'bpmn/reference/delegate-task-api',
            'bpmn/reference/variables',
            'bpmn/reference/error-handling',
            'bpmn/reference/process-extensions',
            'bpmn/reference/business-calendars',
          ],
        },
        {
          type: 'category',
          label: 'Integration',
          link: {type: 'doc', id: 'bpmn/integration/index'},
          items: [
            'bpmn/integration/connectors',
            'bpmn/integration/spring-integration',
            'bpmn/integration/jpa-process-variables',
          ],
        },
      ],
    },
    {
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Advanced Topics',
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
          label: 'Authorization & Security',
          link: {type: 'generated-index', title: 'Authorization Overview'},
          items: [
            'advanced/process-definition-authorization',
            'advanced/process-identity-links',
            'advanced/security-policies',
          ],
        },
        {
          type: 'category',
          label: 'Operations & Administration',
          link: {type: 'generated-index', title: 'Operations Overview'},
          items: [
            'advanced/database-schema',
            'advanced/management-service',
            'advanced/job-lifecycle',
            'advanced/multi-tenancy',
          ],
        },
        {
          type: 'category',
          label: 'Engine Extensibility',
          link: {type: 'generated-index', title: 'Extensibility Overview'},
          items: [
            'advanced/custom-parse-handlers',
            'advanced/testing-infrastructure',
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
      type: 'category',
      collapsible: true,
      collapsed: true,
      label: 'Best Practices & Patterns',
      link: {type: 'doc', id: 'best-practices/index'},
      items: [
        'best-practices/guide',
        'implementation-patterns',
      ],
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
      link: {type: 'doc', id: 'examples/overview'},
      items: [
        {
          type: 'category',
          label: 'Order Management Workflow',
          link: {type: 'doc', id: 'examples/order-management-workflow/summary'},
          items: [
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
