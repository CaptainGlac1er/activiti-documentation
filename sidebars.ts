import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Restructured sidebar for better navigation
 * - Maximum 3 levels of nesting
 * - Logical grouping by topic
 * - Clear separation of concepts, guides, and API reference
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'quickstart',
      label: 'Quick Start',
      className: 'hero-quickstart',
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {type: 'doc', id: 'architecture/overview'},
      items: [
        'architecture/overview',
      ],
    },
    {
      type: 'category',
          label: 'Getting Started',   link: {type: 'doc', id: 'getting-started/configuration'},
      items: [
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
          label: 'BPMN Elements',   link: {type: 'doc', id: 'bpmn/index'},
      items: [
        {
          type: 'category',
          label: 'Elements',
          link: {type: 'generated-index'},
          items: [
            'bpmn/elements/user-task',
            'bpmn/elements/service-task',
            'bpmn/elements/script-task',
            'bpmn/elements/receive-task',
            'bpmn/elements/business-rule-task',
            'bpmn/elements/call-activity',
            'bpmn/elements/manual-task',
            'bpmn/elements/sequence-flows',
          ],
        },
        {
          type: 'category',
          label: 'Events',
          link: {type: 'doc', id: 'bpmn/events/index'},
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
          link: {type: 'doc', id: 'bpmn/gateways/index'},
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
          label: 'SubProcesses',
          link: {type: 'doc', id: 'bpmn/subprocesses/index'},
          items: [
            'bpmn/subprocesses/index',
            'bpmn/subprocesses/regular-subprocess',
            'bpmn/subprocesses/event-subprocess',
            'bpmn/subprocesses/adhoc-subprocess',
            'bpmn/subprocesses/transaction',
          ],
        },
        'bpmn/common-features',
        {
          type: 'category',
          label: 'Advanced Topics',
          link: {type: 'generated-index'},
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
          link: {type: 'doc', id: 'bpmn/integration/index'},
          items: [
            'bpmn/integration/index',
            'bpmn/integration/connectors',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Core Services',
      link: {type: 'generated-index', title: 'Engine Services Overview'},
      items: [
        'api-reference/engine-api/repository-service',
        'api-reference/engine-api/runtime-service',
        'api-reference/engine-api/task-service',
        'api-reference/engine-api/history-service',
        'api-reference/engine-api/management-service',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {type: 'doc', id: 'api-reference/overview'},
      items: [
        {
          type: 'category',
          label: 'Activiti API',
          link: {type: 'doc', id: 'api-reference/activiti-api/README'},
          items: [
            'api-reference/activiti-api/process-model',
            'api-reference/activiti-api/task-model',
            'api-reference/activiti-api/process-runtime',
            'api-reference/activiti-api/task-runtime',
            'api-reference/activiti-api/runtime-shared',
            'api-reference/activiti-api/model-shared',
            'api-reference/activiti-api/api-implementation',
          ],
        },
        {
          type: 'category',
          label: 'Core Common',
          link: {type: 'doc', id: 'api-reference/core-common/README'},
          items: [
            'api-reference/core-common/common-util',
            'api-reference/core-common/expression-language',
            'api-reference/core-common/connector-model',
            'api-reference/core-common/spring-application',
            'api-reference/core-common/spring-connector',
            'api-reference/core-common/spring-identity',
            'api-reference/core-common/spring-security',
            'api-reference/core-common/project-model',
          ],
        },
        {
          type: 'category',
          label: 'Engine API',
          link: {type: 'doc', id: 'api-reference/engine-api/README'},
          items: [
            'api-reference/engine-api/engine-core',
            'api-reference/engine-api/bpmn-model',
            'api-reference/engine-api/bpmn-converter',
            'api-reference/engine-api/engine-configuration',
            'api-reference/engine-api/engine-architecture',
            'api-reference/engine-api/api-implementation',
            'api-reference/engine-api/async-execution',
            'api-reference/engine-api/dynamic-bpmn-service',
            'api-reference/engine-api/scripting-engine',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      link: {type: 'doc', id: 'advanced/implementation-patterns'},
      items: [
        'advanced/implementation-patterns',
      ],
    },
    {
      type: 'category',
      label: 'Best Practices',
      link: {type: 'doc', id: 'best-practices/overview'},
      items: [
        'best-practices/overview',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      link: {type: 'doc', id: 'troubleshooting/overview'},
      items: [
        'troubleshooting/overview',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      link: {type: 'generated-index', title: 'Complete Working Examples'},
      items: [
        {
          type: 'category',
          label: 'Order Management Workflow',
          link: {type: 'doc', id: 'examples/order-management-workflow/summary'},
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
