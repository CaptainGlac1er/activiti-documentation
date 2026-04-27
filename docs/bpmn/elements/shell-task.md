---
sidebar_label: Shell Task
slug: /bpmn/elements/shell-task
title: "Shell Task"
description: "Complete guide to Shell Tasks in Activiti - executing operating system commands from your workflow with output capture and error handling."
---

# Shell Task

Shell Tasks are a service task type that **executes operating system commands** directly from your BPMN process. They support capturing command output, error codes, and configuring environment variables. Shell tasks are configured using field injection on a service task with `activiti:type="shell"`.

## Overview

```xml
<serviceTask id="shellTask" name="Run Shell Command" activiti:type="shell">
  <extensionElements>
    <activiti:field name="command" stringValue="echo" />
    <activiti:field name="arg1" stringValue="Hello World" />
    <activiti:field name="outputVariable" stringValue="shellOutput" />
    <activiti:field name="errorCodeVariable" stringValue="exitCode" />
  </extensionElements>
</serviceTask>
```

**BPMN 2.0 Standard:** Activiti Extension  
**Implementation:** `ShellActivityBehavior`

## Configuration

Shell tasks are configured through `<activiti:field>` child elements inside `<extensionElements>`. Each field corresponds to a parameter of the shell execution.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `command` | String | The command or executable to run (e.g., `echo`, `/bin/sh`, `python`) |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `arg1` - `arg5` | String | Up to 5 command arguments | None |
| `wait` | Boolean | Whether to wait for the command to complete before continuing | `true` |
| `outputVariable` | String | Process variable name to store the command stdout as a **String** | Not stored |
| `errorCodeVariable` | String | Process variable name to store the exit code as a **String** | Not stored |
| `redirectError` | Boolean | Whether to redirect stderr to stdout | `false` |
| `cleanEnv` | Boolean | Whether to clean the environment before execution | `false` |
| `directory` | String | Working directory for the command | Current working directory |

### Expression Support

All fields accept either `stringValue` for literals or `expression` for runtime evaluation:

```xml
<serviceTask id="dynamicShell" name="Dynamic Command" activiti:type="shell">
  <extensionElements>
    <activiti:field name="command">
      <activiti:expression>${shellCommand}</activiti:expression>
    </activiti:field>
    <activiti:field name="arg1">
      <activiti:expression>${arg1Value}</activiti:expression>
    </activiti:field>
    <activiti:field name="directory" stringValue="/opt/deploy"/>
    <activiti:field name="outputVariable" stringValue="result"/>
  </extensionElements>
</serviceTask>
```

## Behavior

When the shell task executes:

1. All field values are resolved (string literals or expressions against process variables)
2. The command and up to 5 arguments are assembled into a `List<String>`
3. A `ShellCommandExecutor` runs the process via `ProcessBuilder`
4. If `wait` is `true`, the engine blocks until the command completes
5. Stdout is stored as a **String** in the `outputVariable`; exit code is stored as a **String** (`Integer.toString()`) in the `errorCodeVariable`
6. If the command throws an exception, an `ActivitiException` is raised which can be caught by a boundary error event
7. The engine calls `leave(execution)` to continue to the next element

### Security: Shell Command Executor Factory

Activiti provides `CommandExecutorContext.setShellExecutorContextFactory()` as an extension point. If your application registers a custom factory, it will be used instead of the default `ShellCommandExecutor`. This allows you to:

- Sanitize command input
- Restrict allowed commands to a whitelist
- Run commands in a sandboxed environment
- Log all shell execution attempts

```java
// Example: Registering a custom shell command executor factory
CommandExecutorContext.setShellExecutorContextFactory(context -> {
    // context.getArgList().get(0) is the command
    // Validate against whitelist, then return a custom CommandExecutor
    return new ShellCommandExecutor(context);
});
```

The `ShellExecutorContext` passed to the factory has these getters: `getArgList()`, `getWaitFlag()`, `getCleanEnvBoolan()`, `getRedirectErrorFlag()`, `getDirectoryStr()`, `getResultVariableStr()`, `getErrorCodeVariableStr()`.

## Examples

### Basic Command Execution

```xml
<serviceTask id="cleanup" name="Cleanup Temp Files" activiti:type="shell">
  <extensionElements>
    <activiti:field name="command" stringValue="/bin/rm"/>
    <activiti:field name="arg1" stringValue="-rf"/>
    <activiti:field name="arg2" stringValue="/tmp/workflow-*.tmp"/>
  </extensionElements>
</serviceTask>
```

### Capturing Output

```xml
<serviceTask id="versionCheck" name="Check App Version" activiti:type="shell">
  <extensionElements>
    <activiti:field name="command" stringValue="java"/>
    <activiti:field name="arg1" stringValue="-version"/>
    <activiti:field name="redirectError" stringValue="true"/>
    <activiti:field name="outputVariable" stringValue="javaVersion"/>
    <activiti:field name="errorCodeVariable" stringValue="versionExitCode"/>
  </extensionElements>
</serviceTask>
```

**Note:** `javaVersion` will be a String containing stdout. `versionExitCode` will be a String like `"0"` or `"1"`.

### With Async Execution and Error Handling

```xml
<serviceTask id="deploy" name="Deploy Application" activiti:type="shell" activiti:async="true">
  <extensionElements>
    <activiti:field name="command" stringValue="kubectl"/>
    <activiti:field name="arg1" stringValue="apply"/>
    <activiti:field name="arg2" stringValue="-f"/>
    <activiti:field name="arg3" stringValue="/opt/deploy/service.yaml"/>
    <activiti:field name="directory" stringValue="/opt/deploy"/>
    <activiti:field name="outputVariable" stringValue="deployOutput"/>
  </extensionElements>
  <boundaryEvent id="deployError" cancelActivity="true">
    <errorEventDefinition errorRef="deployErrorDef"/>
  </boundaryEvent>
</serviceTask>
```

### Retry Configuration

When running async, shell tasks benefit from retry configuration:

```xml
<serviceTask id="resilientShell" name="Resilient Command" activiti:type="shell"
    activiti:async="true"
    activiti:failedJobRetryTimeCycle="R3/PT5M">
  <extensionElements>
    <activiti:field name="command" stringValue="curl"/>
    <activiti:field name="arg1" stringValue="-s"/>
    <activiti:field name="arg2">
      <activiti:expression>${endpoint}</activiti:expression>
    </activiti:field>
    <activiti:field name="outputVariable" stringValue="curlOutput"/>
  </extensionElements>
</serviceTask>
```

## Limitations

- **Maximum 5 arguments** — The engine supports `arg1` through `arg5` only. For commands needing more arguments, concatenate them into fewer fields or use a shell script as the command.
- **No built-in input stream** — Shell tasks cannot pipe data into stdin. Use a temporary file and reference it as an argument instead.
- **Security risk** — Shell commands execute with the permissions of the process running Activiti. Always validate and sanitize expression-resolved arguments, and consider using `CommandExecutorContext.setShellExecutorContextFactory()` for whitelisting.
- **Platform dependency** — Commands are OS-specific. Shell tasks are not portable across Windows/Linux/macOS without conditional logic.
- **Output is always String** — Both stdout and the exit code are stored as `String` process variables, not typed values.

## Best Practices

1. **Use async for anything beyond instant commands** — Prevents blocking the workflow thread
2. **Capture output and exit codes** — Store in process variables for downstream decisions and audit trails
3. **Use `redirectError="true"`** — Ensures stderr is captured alongside stdout
4. **Configure `directory`** — Avoids relying on the container's working directory
5. **Add boundary error events** — Handles command failures gracefully within the workflow
6. **Validate expression input** — Never pass user-controlled data directly into shell arguments without sanitization
7. **Consider `CommandExecutorContext`** — Implement a custom factory for production environments to whitelist commands

## Related Documentation

- [Service Task](./service-task.md) — General service task types and configuration
- [Async Execution](../reference/async-execution.md) — Async boundaries and retry policies
- [Error Handling](../reference/error-handling.md) — Boundary events and error propagation
- [Script Task](./script-task.md) — Alternative for inline scripting logic
- [Field Injection](../reference/java-delegate.md) — Field injection patterns shared across delegates
