import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.scss';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Process Management',
    icon: '⚙️',
    description: (
      <>
        Design, deploy, and execute BPMN 2.0 processes with a powerful runtime API.
        Start processes, manage instances, and track execution with full control over your workflows.
      </>
    ),
  },
  {
    title: 'Task Automation',
    icon: '📋',
    description: (
      <>
        Manage user tasks, assignments, and completions seamlessly. Support for candidate users,
        groups, and dynamic task routing to optimize your business processes.
      </>
    ),
  },
  {
    title: 'Event-Driven Architecture',
    icon: '🔔',
    description: (
      <>
        React to process and task events with a comprehensive event system. Implement custom
        listeners, handle business logic, and integrate with external systems effortlessly.
      </>
    ),
  },
  {
    title: 'Type-Safe API',
    icon: '🔒',
    description: (
      <>
        Clean, type-safe interfaces with fluent payload builders. Catch errors at compile-time
        and enjoy excellent IDE support with auto-completion and documentation.
      </>
    ),
  },
  {
    title: 'Spring Boot Integration',
    icon: '🌱',
    description: (
      <>
        Built-in support for Spring Boot with auto-configuration and dependency injection.
        Drop Activiti into your Spring application and start building workflows immediately.
      </>
    ),
  },
  {
    title: 'Security & Authorization',
    icon: '🛡️',
    description: (
      <>
        Enterprise-grade security with role-based access control, task visibility rules,
        and seamless integration with Spring Security. Protect your processes and data.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <div className={styles.featureContent}>
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresHeader}>
          <Heading as="h2" className={styles.featuresTitle}>
            🚀 Why Choose Activiti API?
          </Heading>
          <p className={styles.featuresSubtitle}>
            Everything you need to build powerful workflow and business process automation
          </p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
