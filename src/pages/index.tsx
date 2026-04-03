import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';

import styles from './index.module.scss';

function HomepageHeader() {
  const { withBaseUrl } = useBaseUrlUtils();
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <Heading as="h1" className="hero__title">
              {siteConfig.title}
            </Heading>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            <p className={styles.heroDescription}>
              Build powerful workflow and business process automation with Activiti API.
              Design, execute, and monitor BPMN 2.0 processes with a clean, type-safe interface.
            </p>
          </div>
          <div className={styles.heroImage}>
            <img 
              src={withBaseUrl('img/logo.svg')}
              alt="Activiti Logo" 
              className={styles.heroLogo}
            />
          </div>
        </div>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/quickstart">
            🚀 Quick Start
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://github.com/Activiti/Activiti"
            target="_blank"
            rel="noopener noreferrer">
            💻 GitHub
          </Link>
        </div>
        <div className={styles.versionBadge}>
          <span className={styles.versionText}>Version 8.7.2-SNAPSHOT</span>
        </div>
      </div>
    </header>
  );
}

function FeatureHighlight() {
  return (
    <section className={styles.featureHighlight}>
      <div className="container">
        <div className={styles.highlightGrid}>
          <div className={styles.highlightItem}>
            <div className={styles.highlightIcon}>⚡</div>
            <h3>Fast & Efficient</h3>
            <p>High-performance workflow engine optimized for modern applications</p>
          </div>
          <div className={styles.highlightItem}>
            <div className={styles.highlightIcon}>🔒</div>
            <h3>Secure by Design</h3>
            <p>Built-in security with role-based access control and authentication</p>
          </div>
          <div className={styles.highlightItem}>
            <div className={styles.highlightIcon}>🎯</div>
            <h3>BPMN 2.0 Compliant</h3>
            <p>Full support for industry-standard Business Process Model and Notation</p>
          </div>
          <div className={styles.highlightItem}>
            <div className={styles.highlightIcon}>🔌</div>
            <h3>Easy Integration</h3>
            <p>Seamlessly integrate with Spring Boot and external systems</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CodePreview() {
  return (
    <section className={styles.codePreview}>
      <div className="container">
        <div className={styles.codeContainer}>
          <div className={styles.codeHeader}>
            <span className={styles.codeTitle}>Simple Process Execution</span>
            <span className={styles.codeLanguage}>Java</span>
          </div>
          <pre className={styles.codeBlock}>
            <code>
              <span className="keyword">@Service</span>
              {'\n'}
              <span className="keyword">public class</span> WorkflowService <span className="brace">{`{`}</span>
              {'\n'}
              {'  '}<span className="keyword">@Autowired</span>
              {'\n'}
              {'  '}<span className="keyword">private</span> ProcessRuntime processRuntime;
              {'\n\n'}
              {'  '}<span className="keyword">public void</span> startProcess() <span className="brace">{`{`}</span>
              {'\n'}
              {'    '}ProcessInstance instance = processRuntime.start(
              {'\n'}
              {'      '}ProcessPayloadBuilder.start()
              {'\n'}
              {'        '}.withProcessDefinitionKey(<span className="string">"loanApplication"</span>)
              {'\n'}
              {'        '}.withVariable(<span className="string">"amount"</span>, <span className="number">10000</span>)
              {'\n'}
              {'        '}.withVariable(<span className="string">"applicant"</span>, <span className="string">"John Doe"</span>)
              {'\n'}
              {'        '}.build()
              {'\n'}
              {'      '});
              {'\n\n'}
              {'    '}System.out.println(<span className="string">"Process started: "</span> + instance.getId());
              {'\n'}
              {'  '}<span className="brace">{`}`}</span>
              {'\n'}
              <span className="brace">{`}`}</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className={styles.quickLinks}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          📚 Documentation Quick Links
        </Heading>
        <div className={styles.linksGrid}>
          <Link className={styles.linkCard} to="/docs/introduction">
            <div className={styles.linkIcon}>📘</div>
            <h3>Introduction</h3>
            <p>Architecture overview and core concepts</p>
          </Link>
          <Link className={styles.linkCard} to="/docs/quickstart">
            <div className={styles.linkIcon}>🚀</div>
            <h3>Quick Start</h3>
            <p>Get up and running in 5 minutes</p>
          </Link>
          <Link className={styles.linkCard} to="/docs/api-reference">
            <div className={styles.linkIcon}>📖</div>
            <h3>API Reference</h3>
            <p>Complete API documentation</p>
          </Link>
          <Link className={styles.linkCard} to="/docs/best-practices">
            <div className={styles.linkIcon}>⭐</div>
            <h3>Best Practices</h3>
            <p>Write better, more efficient code</p>
          </Link>
          <Link className={styles.linkCard} to="/docs/implementation-patterns">
            <div className={styles.linkIcon}>🏗️</div>
            <h3>Implementation Patterns</h3>
            <p>Architecture and integration strategies</p>
          </Link>
          <Link className={styles.linkCard} to="/docs/troubleshooting">
            <div className={styles.linkIcon}>🔧</div>
            <h3>Troubleshooting</h3>
            <p>Solve common issues and problems</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className={styles.community}>
      <div className="container">
        <div className={styles.communityContent}>
          <div>
            <Heading as="h2">🤝 Join the Community</Heading>
            <p className={styles.communityText}>
              Connect with other developers, report issues, and contribute to Activiti API.
              We're building this together!
            </p>
            <div className={styles.communityLinks}>
              <Link
                className="button button--secondary"
                to="https://github.com/Activiti/Activiti"
                target="_blank"
                rel="noopener noreferrer">
                📦 GitHub Repository
              </Link>
            </div>
          </div>
          <div className={styles.communityStats}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>10K+</div>
              <div className={styles.statLabel}>GitHub Stars</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>500+</div>
              <div className={styles.statLabel}>Contributors</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>8.7</div>
              <div className={styles.statLabel}>Current Version</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Workflow & BPM Engine API`}
      description="Powerful workflow and Business Process Management (BPM) engine API for modern applications. Design, execute, and monitor BPMN 2.0 processes with ease.">
      <HomepageHeader />
      <main>
        <FeatureHighlight />
        <CodePreview />
        <HomepageFeatures />
        <QuickLinks />
        <CommunitySection />
      </main>
    </Layout>
  );
}
