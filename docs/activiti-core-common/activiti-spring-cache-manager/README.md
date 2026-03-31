# Activiti Spring Cache Manager Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-cache-manager`

**Target Audience:** Senior Software Engineers, Performance Engineers

**Version:** 8.7.2-SNAPSHOT

---

## Overview

The **activiti-spring-cache-manager** module provides Spring cache management integration for Activiti. It supports multiple cache providers including Caffeine, enabling efficient caching of process data, variables, and frequently accessed resources.

### Key Features

- **Multi-Provider Support**: Caffeine, Simple, Noop caches
- **Auto-Configuration**: Spring Boot integration
- **Cache Management**: Centralized cache configuration
- **Performance Optimization**: In-memory caching
- **Environment-Based**: Configurable via properties

### Key Classes

- `ActivitiSpringCacheManagerProperties` - Cache configuration properties
- `ActivitiSpringCaffeineCacheConfigurer` - Caffeine cache configuration
- `ActivitiSpringCacheManagerAutoConfiguration` - Auto-configuration

### Usage Example

```yaml
# application.yml
activiti:
  cache:
    provider: caffeine
    caffeine:
      maximum-size: 1000
      expire-after-write: 10m
```

```java
@Autowired
private CacheManager cacheManager;

public void cacheProcessData(String key, Object data) {
    cacheManager.getCache("processData").put(key, data);
}
```

---

## Architecture

```
CacheManager
    ├── CaffeineCache (high-performance)
    ├── SimpleCache (basic)
    └── NoopCache (disabled)
```

---

## Configuration

### Properties

```yaml
activiti:
  cache:
    enabled: true
    provider: caffeine  # caffeine, simple, noop
    caffeine:
      maximum-size: 1000
      expire-after-write: 10m
      expire-after-access: 5m
```

---

## Best Practices

1. **Use Caffeine for production**
2. **Set appropriate cache sizes**
3. **Configure expiration times**
4. **Monitor cache hit rates**

---

## API Reference

### ActivitiSpringCacheManagerProperties

```java
String getProvider();
boolean isEnabled();
CaffeineProperties getCaffeine();
```

---

## See Also

- [Parent Module Documentation](../README.md)
- [Spring Integration](../activiti-spring-application/README.md)
