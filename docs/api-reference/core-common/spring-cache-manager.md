---
sidebar_label: Spring Cache Manager
slug: /api-reference/core-common/spring-cache-manager
title: "Spring Cache Manager"
description: Spring-based cache manager implementation for Activiti process engine caching.
---

# Activiti Spring Cache Manager Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-cache-manager`

---

## Overview

The **activiti-spring-cache-manager** module provides Spring cache management integration for Activiti. It supports multiple cache providers including Caffeine, enabling efficient caching of process data, variables, and frequently accessed resources.

### Key Features

- **Multi-Provider Support**: Caffeine, Simple, Noop caches
- **Auto-Configuration**: Spring Boot integration
- **Per-Cache Configuration**: Individual cache settings via `caches` map
- **Custom Configurers**: `ActivitiSpringCaffeineCacheConfigurer` for programmatic customization
- **Environment-Based**: Configurable via properties under `activiti.spring.cache-manager.*`

### Key Classes

- `ActivitiSpringCacheManagerProperties` - Cache configuration properties (`@ConfigurationProperties("activiti.spring.cache-manager")`)
- `ActivitiSpringCaffeineCacheConfigurer` - Interface extending `Predicate<String>` and `Function<Caffeine,Object,Object>, Cache<Object, Object>>` for custom Caffeine cache building
- `ActivitiSpringCacheManagerAutoConfiguration` - Auto-configuration
- `ActivitiSpringCacheManagerEnvironmentPostProcessor` - Sets `spring.cache.type` from provider

### Usage Example

```yaml
# application.yml
activiti:
  spring:
    cache-manager:
      provider: caffeine
      caffeine:
        default-spec: "maximumSize=1000, expireAfterAccess=5m, recordStats"
        allow-null-values: true
        use-system-scheduler: true
      caches:
        processData:
          enabled: true
          caffeine:
            spec: "maximumSize=500, expireAfterWrite=10m"
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
activiti.spring.cache-manager
    ├── Caffeine provider (high-performance, default)
    │   ├── defaultSpec: CaffeineSpec string applied to all caches
    │   ├── allowNullValues: boolean
    │   ├── useSystemScheduler: boolean
    │   └── caches.<name>.caffeine.spec: per-cache CaffeineSpec override
    ├── Simple provider (ConcurrentMapCacheManager)
    │   └── allowNullValues: boolean
    └── Noop provider (disabled)
```

---

## Configuration

### Properties Prefix

All properties are prefixed with **`activiti.spring.cache-manager`**.

### Global Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `activiti.spring.cache-manager.enabled` | `boolean` | `true` | Enable/disable the cache manager |
| `activiti.spring.cache-manager.provider` | `CacheProvider` | `caffeine` | One of: `caffeine`, `simple`, `noop` |

### Caffeine Provider Properties

The Caffeine provider uses a **`default-spec`** string (CaffeineSpec format) rather than individual numeric properties.

| Property | Type | Default | Description |
|---|---|---|---|
| `activiti.spring.cache-manager.caffeine.default-spec` | `String` | `"maximumSize=1000, expireAfterAccess=5m, recordStats"` | CaffeineSpec string applied as default to all caches |
| `activiti.spring.cache-manager.caffeine.allow-null-values` | `boolean` | `true` | Allow storing null values in cache |
| `activiti.spring.cache-manager.caffeine.use-system-scheduler` | `boolean` | `true` | Use system scheduler for expiration tasks |

CaffeineSpec string supports: `maximumSize`, `initialCapacity`, `expireAfterWrite`, `expireAfterAccess`, `refreshAfterWrite`, `recordStats`, and other [Caffeine spec options](https://github.com/ben-manes/caffeine/wiki/Configuration).

### Simple Provider Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `activiti.spring.cache-manager.simple.allow-null-values` | `boolean` | `true` | Allow storing null values in cache |

### Per-Cache Configuration

Individual caches are configured under the `caches` map. Each cache can override its Caffeine settings.

```yaml
activiti:
  spring:
    cache-manager:
      caches:
        myCache:
          enabled: true
          caffeine:
            spec: "initialCapacity=50, maximumSize=500, expireAfterWrite=15m"
```

| Property | Type | Default | Description |
|---|---|---|---|
| `activiti.spring.cache-manager.caches.<name>.enabled` | `boolean` | `true` | Enable/disable the named cache |
| `activiti.spring.cache-manager.caches.<name>.caffeine.spec` | `String` | _(falls back to `default-spec`)_ | Per-cache CaffeineSpec override |

If `caches.<name>.caffeine.spec` is not set, the `caffeine.default-spec` is used.

### Full Example

```yaml
activiti:
  spring:
    cache-manager:
      enabled: true
      provider: caffeine
      caffeine:
        default-spec: "maximumSize=1000, expireAfterAccess=5m, recordStats"
        allow-null-values: true
        use-system-scheduler: true
      caches:
        processDefinitions:
          enabled: true
          caffeine:
            spec: "maximumSize=500, expireAfterWrite=10m"
        customCache:
          enabled: true
        disabledCache:
          enabled: false
```

---

## Custom Caffeine Configurer

Implement `ActivitiSpringCaffeineCacheConfigurer` (a `Predicate<String>` + `Function<Caffeine, Cache>`) to programmatically customize specific caches:

```java
@Bean
public ActivitiSpringCaffeineCacheConfigurer customConfigurer() {
    return new ActivitiSpringCaffeineCacheConfigurer() {
        @Override
        public boolean test(String cacheName) {
            return "myCache".equals(cacheName);
        }

        @Override
        public Cache<Object, Object> apply(Caffeine<Object, Object> caffeine) {
            return caffeine.build(key -> computeValue(key));
        }
    };
}
```

The `Caffeine` instance passed to `apply()` already has the spec from properties (or `default-spec`) and `systemScheduler` applied.

---

## API Reference

### ActivitiSpringCacheManagerProperties

```java
@ConfigurationProperties("activiti.spring.cache-manager")
public class ActivitiSpringCacheManagerProperties {

    public enum CacheProvider { noop, simple, caffeine }

    boolean isEnabled();
    void setEnabled(boolean enabled);

    CacheProvider getProvider();
    void setProvider(CacheProvider provider);

    Map<String, ActivitiCacheProperties> getCaches();

    CaffeineCacheProviderProperties getCaffeine();
    void setCaffeine(CaffeineCacheProviderProperties caffeine);

    SimpleCacheProviderProperties getSimple();
    void setSimple(SimpleCacheProviderProperties simple);

    // Per-cache properties
    public static class ActivitiCacheProperties {
        boolean isEnabled();
        CacheProperties.Caffeine getCaffeine();
    }

    // Caffeine provider settings
    public static class CaffeineCacheProviderProperties {
        boolean isAllowNullValues();
        String getDefaultSpec();
        boolean isUseSystemScheduler();
    }

    // Simple provider settings
    public static class SimpleCacheProviderProperties {
        boolean isAllowNullValues();
    }
}
```

### ActivitiSpringCaffeineCacheConfigurer

```java
public interface ActivitiSpringCaffeineCacheConfigurer
    extends Predicate<String>, Function<Caffeine<Object,Object>, Cache<Object, Object>> {
}
```

---

## Best Practices

1. **Use Caffeine for production** — default provider, best performance
2. **Use `default-spec` string format** — CaffeineSpec format like `"maximumSize=1000, expireAfterAccess=5m"`
3. **Configure per-cache overrides** — use `caches.<name>.caffeine.spec` for caches with different requirements
4. **Disable unnecessary caches** — set `caches.<name>.enabled=false` rather than removing them
5. **Monitor cache hit rates** — include `recordStats` in spec strings to enable statistics

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Spring Integration](./spring-application.md)
