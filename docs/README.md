# Activiti Documentation

Welcome to the **Activiti API Documentation** - your comprehensive guide to building workflow and business process applications with Activiti.

## 🎯 What's New in This Structure

This documentation has been **restructured for better usability**:

- ✅ **Maximum 3 levels** of nesting (was 4-5)
- ✅ **Logical grouping** by topic, not module
- ✅ **Clear separation** of concepts, guides, and API reference
- ✅ **Better navigation** with improved sidebar
- ✅ **Easier to find** what you need

## 📚 Documentation Sections

### 🏛️ Architecture
Understand how Activiti works under the hood:
- **Overview** - High-level architecture and design principles
- **Engine Architecture** - Deep dive into core components
- **History Levels** - Configure audit and tracking
- **Multi-Tenancy** - Multi-tenant deployment patterns

### 📦 Getting Started
Quick setup and first steps:
- **Installation** - Set up Activiti in your project
- **Configuration** - Configure the engine
- **Spring Boot Integration** - Use with Spring Boot
- **First Process** - Deploy and run your first workflow

### ⚙️ Core Services
Main engine services for process management:
- **Repository Service** - Deploy and manage process definitions
- **Runtime Service** - Execute processes and manage instances
- **Task Service** - Work with user tasks
- **History Service** - Query historical data
- **Management Service** - Admin and monitoring
- **External Task Service** - Worker pattern integration

### 🎨 Process Design
BPMN 2.0 design guide:
- **BPMN Basics** - Fundamentals of BPMN
- **User Tasks** - Human interaction patterns
- **Service Tasks** - Automated processing
- **Gateways** - Decision points and branching
- **Events** - Triggers and responses
- **Variables** - Data management

### 🔌 API Reference
Complete API documentation:
- **Activiti API** - Modern, type-safe API
  - Process API
  - Task API
- **Engine API** - Legacy but powerful
  - Services
  - Queries
  - Events

### 🔗 Integration
Connect Activiti with other systems:
- **Spring Integration** - Full Spring ecosystem support
- **Connectors** - Pre-built integrations
- **Form Integration** - User forms and UI
- **Identity Providers** - Authentication and authorization

### 🚀 Advanced Topics
Power features for complex scenarios:
- **Custom Activities** - Extend BPMN semantics
- **Process Extensions** - Add custom behavior
- **Async Execution** - Performance optimization
- **Messaging** - Event-driven architectures
- **Clustering** - High availability setups

### ✨ Best Practices
Guidelines for production systems:
- **Performance** - Optimization techniques
- **Security** - Secure your workflows
- **Testing** - Test strategies
- **Migration** - Upgrade paths

### 🐛 Troubleshooting
Solve common problems:
- **Common Errors** - Error messages and fixes
- **Debugging** - Debug techniques
- **FAQ** - Frequently asked questions

### 🔄 Migration Guides
Upgrade from older versions:
- **From Activiti 6** - Migration path
- **From Activiti 7** - Migration path
- **Upgrade Notes** - Version-specific changes

## 🚀 Quick Links

- [Introduction](./intro.md) - Start here
- [Quick Start](./quickstart.md) - Get running in 5 minutes
- [Architecture Overview](./architecture/overview.md) - How it works
- [Core Services](./core-services/) - Main APIs
- [Best Practices](./best-practices/) - Production guidelines

## 📖 How to Use This Documentation

### For New Users
1. Start with [Introduction](./intro.md)
2. Follow the [Quick Start](./quickstart.md)
3. Read [Getting Started](./getting-started/) guides
4. Explore [Core Services](./core-services/)

### For Experienced Users
1. Jump to specific [Core Services](./core-services/)
2. Reference [API Documentation](./api-reference/)
3. Check [Advanced Topics](./advanced/)
4. Review [Best Practices](./best-practices/)

### For Migration
1. Read [Migration Guides](./migration/)
2. Check [Upgrade Notes](./migration/README.md)
3. Review breaking changes
4. Follow migration checklist

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run start

# Build for production
npm run build

# Clear cache
npm run clear
```

### Adding Documentation

1. Create file in appropriate section
2. Add front matter:
```yaml
---
sidebar_label: Your Title
slug: /section/your-page
description: Brief description
---
```
3. Update `sidebars.ts` if needed
4. Test locally
5. Submit PR

### Front Matter Fields

- `sidebar_label` - Title shown in navigation
- `slug` - URL path
- `description` - Meta description for SEO
- `sidebar_class_name` - Custom CSS class (optional)
- `keywords` - SEO keywords (optional)

## 🤝 Contributing

### Documentation Guidelines

- **Be clear** - Use simple, direct language
- **Be concise** - Get to the point quickly
- **Include examples** - Show, don't just tell
- **Add reasoning** - Explain "why", not just "how"
- **Use diagrams** - Visual aids when helpful
- **Link related content** - Help users navigate

### Code Examples

- ✅ Complete and working
- ✅ Well-commented
- ✅ Follow best practices
- ✅ Include error handling
- ✅ Show real-world usage

### Review Process

1. Submit PR
2. Automated checks run
3. Maintainer reviews
4. Feedback incorporated
5. Merge to main

## 📝 Migration from Old Structure

If you're coming from the old documentation structure:

| Old Path | New Path |
|----------|----------|
| `activiti-core/activiti-engine/01-engine-architecture.md` | `architecture/overview.md` |
| `activiti-core/activiti-engine/02-engine-configuration.md` | `getting-started/configuration.md` |
| `activiti-core/activiti-engine/04-repository-service.md` | `core-services/repository-service.md` |
| `activiti-core/activiti-engine/05-runtime-service.md` | `core-services/runtime-service.md` |
| `activiti-core/activiti-engine/06-task-service.md` | `core-services/task-service.md` |
| `activiti-core/activiti-engine/07-history-service.md` | `core-services/history-service.md` |

All old links will automatically redirect to new locations.

## 🔍 Search Tips

The documentation includes full-text search:

- Use **keywords** from your problem
- Search for **API method names**
- Try **BPMN element names**
- Look for **error messages**
- Search **configuration properties**

## 📞 Support

- **GitHub Issues** - Report bugs or request features
- **Stack Overflow** - Ask questions (tag: `activiti`)
- **Community** - Join the Activiti community
- **Devoxx Genie** - Follow us on Bluesky @devoxxgenie.bsky.social

## 📄 License

This documentation is part of the Activiti project and licensed under the Apache License 2.0.

## 🎉 Thank You

Thank you for using Activiti! We hope this documentation helps you build amazing workflow applications.

---

**Last Updated:** $(date +%Y-%m-%d)  
**Version:** 8.7.2-SNAPSHOT  
**Documentation Structure:** v2.0 (Restructured)
