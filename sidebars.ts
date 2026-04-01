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
      id: 'intro',
      label: '👋 Introduction',
      className: 'hero-intro',
    },
    {
      type: 'doc',
      id: 'quickstart',
      label: '🚀 Quick Start',
      className: 'hero-quickstart',
    },
    {
      type: 'category',
      label: '🏛️ Architecture',
      link: {type: 'doc', id: 'architecture/overview'},
      items: [
        'architecture/overview',
      ],
    },
    {
      type: 'category',
      label: '📦 Getting Started',
      link: {type: 'doc', id: 'getting-started/configuration'},
      items: [
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: '⚙️ Core Services',
      link: {type: 'generated-index', title: 'Engine Services Overview'},
      items: [
        'core-services/repository-service',
        'core-services/runtime-service',
        'core-services/task-service',
        'core-services/history-service',
        'core-services/management-service',
        'core-services/external-task-service',
      ],
    },
    {
      type: 'category',
      label: '🔌 API Reference',
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
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '🚀 Advanced Topics',
      link: {type: 'doc', id: 'advanced/implementation-patterns'},
      items: [
        'advanced/implementation-patterns',
      ],
    },
    {
      type: 'category',
      label: '✨ Best Practices',
      link: {type: 'doc', id: 'best-practices/overview'},
      items: [
        'best-practices/overview',
      ],
    },
    {
      type: 'category',
      label: '🐛 Troubleshooting',
      link: {type: 'doc', id: 'troubleshooting/overview'},
      items: [
        'troubleshooting/overview',
      ],
    },
  ],
};

export default sidebars;
