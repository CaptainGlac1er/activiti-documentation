---
name: configuration-properties
description: Reference for Activiti Spring Boot configuration properties — defaults, types, and valid values
license: Apache-2.0
compatibility: opencode
metadata:
  audience: documentation
  workflow: validation
---

## What I Do

I provide a structured reference for validating Spring Boot configuration properties in Activiti documentation. When loaded, I give agents the property names, types, defaults, and valid values from the source.

---

## ActivitiProperties

**Source:** `org.activiti.spring.boot.ActivitiProperties`
**Prefix:** `@ConfigurationProperties("spring.activiti")`

| Property (YAML) | Source Field | Type | Default | Notes |
|-----------------|--------------|------|---------|-------|
| `check-process-definitions` | `checkProcessDefinitions` | `boolean` | `true` | Validate BPMN on deployment |
| `async-executor-activate` | `asyncExecutorActivate` | `boolean` | `true` | Enable async job executor |
| `deployment-name` | `deploymentName` | `String` | `"SpringAutoDeployment"` | Auto-deployment name |
| `database-schema-update` | `databaseSchemaUpdate` | `String` | `"true"` | Values: `"false"`, `"true"`, `"create-drop"` |
| `database-schema` | `databaseSchema` | `String` | `null` | Custom schema name |
| `db-history-used` | `dbHistoryUsed` | `boolean` | `false` | Enable history tables |
| `history-level` | `historyLevel` | `HistoryLevel` | `NONE` | Values: `NONE`, `ACTIVITY`, `AUDIT`, `FULL` |
| `process-definition-location-prefix` | `processDefinitionLocationPrefix` | `String` | `"classpath*:**/processes/"` | Auto-discovery prefix |
| `process-definition-location-suffixes` | `processDefinitionLocationSuffixes` | `List<String>` | `["**/*.bpmn20.xml", "**/*.bpmn"]` | Auto-discovery patterns |
| `custom-mybatis-mappers` | `customMybatisMappers` | `List<String>` | `null` | Custom MyBatis mapper classes |
| `custom-mybatis-xml-mappers` | `customMybatisXMLMappers` | `List<String>` | `null` | Custom MyBatis XML mapper files |
| `use-strong-uuids` | `useStrongUuids` | `boolean` | `true` | Strong UUID generation |
| `copy-variables-to-local-for-tasks` | `copyVariablesToLocalForTasks` | `boolean` | `true` | Auto-copy to task scope |
| `deployment-mode` | `deploymentMode` | `String` | `"default"` | Deployment strategy |
| `serialize-pojos-in-variables-to-json` | `serializePOJOsInVariablesToJson` | `boolean` | `true` | POJO serialization |
| `java-class-field-for-jackson` | `javaClassFieldForJackson` | `String` | `@class` | Jackson type ID field |
| `process-definition-cache-limit` | `processDefinitionCacheLimit` | `Integer` | `null` | Max cached (0 = unlimited) |
| `process-definition-cache-name` | `processDefinitionCacheName` | `String` | `null` | Custom cache name |
| `mail-server-host` | `mailServerHost` | `String` | `"localhost"` | SMTP host |
| `mail-server-port` | `mailServerPort` | `int` | `1025` | SMTP port |
| `mail-server-user-name` | `mailServerUserName` | `String` | `null` | SMTP username |
| `mail-server-password` | `mailServerPassword` | `String` | `null` | SMTP password |
| `mail-server-default-from` | `mailServerDefaultFrom` | `String` | `null` | Default sender |
| `mail-server-use-ssl` | `mailServerUseSsl` | `boolean` | `false` | SSL connection |
| `mail-server-use-tls` | `mailServerUseTls` | `boolean` | `false` | TLS connection |

---

## AsyncExecutorProperties

**Source:** `org.activiti.spring.boot.AsyncExecutorProperties`
**Prefix:** `@ConfigurationProperties(prefix = "spring.activiti.async-executor")`

| Property (YAML) | Source Field | Type | Default | Notes |
|-----------------|--------------|------|---------|-------|
| `retry-wait-time-in-millis` | `retryWaitTimeInMillis` | `int` | `500` | Wait before retry (ms) |
| `number-of-retries` | `numberOfRetries` | `int` | `3` | Failed job retry count |
| `core-pool-size` | `corePoolSize` | `int` | `2` | Min threads |
| `max-pool-size` | `maxPoolSize` | `int` | `10` | Max threads |
| `keep-alive-time` | `keepAliveTime` | `long` | `5000` | Idle thread timeout (ms) |
| `queue-size` | `queueSize` | `int` | `100` | Job queue capacity |
| `seconds-to-wait-on-shutdown` | `secondsToWaitOnShutdown` | `long` | `60` | Graceful shutdown (sec) |
| `max-timer-jobs-per-acquisition` | `maxTimerJobsPerAcquisition` | `int` | `1` | Timer jobs per query |
| `max-async-jobs-due-per-acquisition` | `maxAsyncJobsDuePerAcquisition` | `int` | `1` | Async jobs per query |
| `default-timer-job-acquire-wait-time-in-millis` | `defaultTimerJobAcquireWaitTimeInMillis` | `int` | `10000` | Between timer acquisitions (ms) |
| `default-async-job-acquire-wait-time-in-millis` | `defaultAsyncJobAcquireWaitTimeInMillis` | `int` | `10000` | Between async acquisitions (ms) |
| `default-queue-size-full-wait-time` | `defaultQueueSizeFullWaitTime` | `int` | `0` | Wait when queue full (ms) |
| `timer-lock-time-in-millis` | `timerLockTimeInMillis` | `int` | `300000` | Timer lock duration (ms) |
| `async-job-lock-time-in-millis` | `asyncJobLockTimeInMillis` | `int` | `300000` | Async job lock duration (ms) |
| `reset-expired-jobs-interval` | `resetExpiredJobsInterval` | `int` | `60000` | Expired job cleanup interval (ms) |
| `reset-expired-jobs-page-size` | `resetExpiredJobsPageSize` | `int` | `3` | Expired job page size |
| `message-queue-mode` | `messageQueueMode` | `boolean` | `false` | Message queue executor |

---

## HistoryLevel Enum

**Source:** `org.activiti.engine.history.HistoryLevel`

| Value | Description |
|-------|-------------|
| `NONE` | No history data stored |
| `ACTIVITY` | Activity instances only |
| `AUDIT` | Activity + task + variable history |
| `FULL` | Complete audit trail including details |

---

## database-schema-update Values

| Value | Effect |
|-------|--------|
| `"false"` | No schema update (fail if schema mismatch) |
| `"true"` | Validate and update schema on startup |
| `"create-drop"` | Create tables on startup, drop on shutdown |

---

## Properties File Format Notes

In `application.properties` (key=value format), Spring Boot property relaxation applies:
- `spring.activiti.checkProcessDefinitions=true` (camelCase)
- `spring.activiti.check-process-definitions=true` (kebab-case)
- `spring.activiti.CHECK_PROCESS_DEFINITIONS=true` (uppercase with env var style)

Lists use comma separation:
- `spring.activiti.process-definition-location-suffixes=**/*.bpmn20.xml,**/*.bpmn`

---

## When to Use Me

Load this skill when:
- Creating configuration documentation
- Validating property names against source
- Checking default values and types
- Writing setup guides with Spring Boot properties
- Verifying history level or schema update options
