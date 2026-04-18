---
sidebar_label: Spring Conformance Tests
slug: /api-reference/engine-api/spring-conformance-tests
description: Engine implementation and services.
---

# Activiti Spring Conformance Tests Module - Technical Documentation

**Module:** `activiti-core/activiti-spring-conformance-tests`

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [BPMN Conformance Suite](#bpmn-conformance-suite)
- [Test Framework](#test-framework)
- [Test Cases](#test-cases)
- [Regression Testing](#regression-testing)
- [Performance Testing](#performance-testing)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-spring-conformance-tests** module provides a comprehensive test suite to validate BPMN 2.0 conformance and engine correctness. It includes regression tests, performance benchmarks, and integration tests to ensure the Activiti engine meets BPMN specifications.

### Key Features

- **BPMN 2.0 Conformance**: Validate against BPMN specification
- **Regression Testing**: Prevent functionality degradation
- **Performance Benchmarks**: Measure engine performance
- **Integration Tests**: Full-stack testing
- **Spring Integration**: Test within Spring context
- **Automated Validation**: CI/CD ready

### Module Structure

```
activiti-spring-conformance-tests/
├── src/test/java/org/activiti/spring/conformance/
│   ├── BpmnConformanceTest.java         # Main conformance test
│   ├── regression/
│   │   ├── RegressionTestSuite.java
│   │   └── RegressionTestCase.java
│   ├── performance/
│   │   ├── PerformanceTestSuite.java
│   │   └── PerformanceBenchmark.java
│   ├── integration/
│   │   ├── IntegrationTestSuite.java
│   │   └── IntegrationTestCase.java
│   └── fixtures/
│       ├── BpmnFixtures.java
│       └── TestData.java
└── src/test/resources/
    ├── bpmn/
    │   ├── conformance/
    │   └── regression/
    └── config/
```

---

## Architecture

### Test Execution Pipeline

```
Test Suite Selection
     │
     ▼
┌─────────────┐
│ Test        │
│ Configuration│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Spring      │
│ Context     │
│ Setup       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Test        │
│ Execution   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Result      │
│ Validation  │
└──────┬──────┘
       │
       ▼
Test Report
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Conformance Test Framework                      │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Test            │  │ Test            │                 │
│  │ Runner          │  │ Executor        │                 │
│  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                           │
│           └────────┬───────────┘                           │
│                    │                                       │
│                    ▼                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Test Suites                              │  │
│  │  - ConformanceTests                                  │  │
│  │  - RegressionTests                                   │  │
│  │  - PerformanceTests                                  │  │
│  │  - IntegrationTests                                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Test Fixtures                            │  │
│  │  - BPMN models                                       │  │
│  │  - Test data                                         │  │
│  │  - Spring configuration                              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## BPMN Conformance Suite

### Conformance Test Base

```java
@SpringBootTest
@AutoConfigureTestDatabase
public abstract class BpmnConformanceTest {
    
    @Autowired
    protected ProcessEngine processEngine;
    
    @Autowired
    protected RuntimeService runtimeService;
    
    @Autowired
    protected TaskService taskService;
    
    @Autowired
    protected RepositoryService repositoryService;
    
    @Autowired
    protected HistoryService historyService;
    
    protected void deployProcess(String bpmnResource) {
        repositoryService.createDeployment()
            .addClasspathResource(bpmnResource)
            .deploy();
    }
    
    protected void assertProcessCompleted(String processInstanceId) {
        ProcessInstance instance = runtimeService
            .createProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .singleResult();
        
        assertNull("Process should be completed", instance);
    }
    
    protected void assertTaskCompleted(String taskId) {
        Task task = taskService.createTaskQuery()
            .taskId(taskId)
            .singleResult();
        
        assertNull("Task should be completed", task);
    }
}
```

### Conformance Test Cases

```java
public class BpmnConformanceTestSuite extends BpmnConformanceTest {
    
    @Test
    public void testSequentialFlow() {
        deployProcess("bpmn/conformance/sequential-flow.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("sequentialFlow");
        
        // Should complete automatically
        assertProcessCompleted(instance.getId());
    }
    
    @Test
    public void testExclusiveGateway() {
        deployProcess("bpmn/conformance/exclusive-gateway.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("exclusiveGateway", 
                Collections.singletonMap("condition", "true"));
        
        assertProcessCompleted(instance.getId());
    }
    
    @Test
    public void testParallelGateway() {
        deployProcess("bpmn/conformance/parallel-gateway.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("parallelGateway");
        
        // Wait for parallel branches to complete
        waitForProcessCompletion(instance.getId());
    }
    
    @Test
    public void testUserTask() {
        deployProcess("bpmn/conformance/user-task.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("userTask");
        
        Task task = taskService.createTaskQuery()
            .processInstanceId(instance.getId())
            .singleResult();
        
        taskService.complete(task.getId());
        
        assertProcessCompleted(instance.getId());
    }
    
    @Test
    public void testServiceTask() {
        deployProcess("bpmn/conformance/service-task.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("serviceTask");
        
        assertProcessCompleted(instance.getId());
    }
    
    @Test
    public void testTimerEvent() {
        deployProcess("bpmn/conformance/timer-event.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("timerEvent");
        
        // Advance time
        Clock.getCurrent().addTime(Duration.ofSeconds(10));
        
        // Trigger job executor
        ManagementService managementService = 
            processEngine.getManagementService();
        managementService.executeJobs();
        
        assertProcessCompleted(instance.getId());
    }
}
```

---

## Test Framework

### Test Runner

```java
public class ConformanceTestRunner {
    
    private final List<TestSuite> suites;
    private final TestResultCollector collector;
    
    public ConformanceTestRunner(List<TestSuite> suites) {
        this.suites = suites;
        this.collector = new TestResultCollector();
    }
    
    public TestReport run() {
        for (TestSuite suite : suites) {
            runSuite(suite);
        }
        
        return collector.generateReport();
    }
    
    private void runSuite(TestSuite suite) {
        log.info("Running suite: {}", suite.getName());
        
        for (TestCase testCase : suite.getTestCases()) {
            try {
                testCase.execute();
                collector.recordPass(testCase);
            } catch (Exception e) {
                collector.recordFail(testCase, e);
            }
        }
    }
}
```

### Test Result Collector

```java
public class TestResultCollector {
    
    private final List<TestResult> results = new ArrayList<>();
    
    public void recordPass(TestCase testCase) {
        results.add(TestResult.builder()
            .testCase(testCase)
            .status(Status.PASS)
            .duration(System.currentTimeMillis() - testCase.getStartTime())
            .build());
    }
    
    public void recordFail(TestCase testCase, Exception exception) {
        results.add(TestResult.builder()
            .testCase(testCase)
            .status(Status.FAIL)
            .exception(exception)
            .duration(System.currentTimeMillis() - testCase.getStartTime())
            .build());
    }
    
    public TestReport generateReport() {
        int passed = (int) results.stream()
            .filter(r -> r.getStatus() == Status.PASS)
            .count();
        
        int failed = (int) results.stream()
            .filter(r -> r.getStatus() == Status.FAIL)
            .count();
        
        return TestReport.builder()
            .totalTests(results.size())
            .passed(passed)
            .failed(failed)
            .results(results)
            .build();
    }
}
```

---

## Test Cases

### Regression Test Cases

```java
public class RegressionTestSuite {
    
    @Test
    public void testIssue123_VariableScope() {
        // Regression test for issue #123
        deployProcess("bpmn/regression/issue-123.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("variableScope", 
                Collections.singletonMap("globalVar", "value"));
        
        Task task = taskService.createTaskQuery()
            .processInstanceId(instance.getId())
            .singleResult();
        
        // Variable should be accessible
        String value = (String) taskService.getVariable(task.getId(), "globalVar");
        assertEquals("value", value);
    }
    
    @Test
    public void testIssue456_MultiInstance() {
        // Regression test for issue #456
        deployProcess("bpmn/regression/issue-456.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("multiInstance",
                Collections.singletonMap("items", Arrays.asList(1, 2, 3)));
        
        // Should create 3 instances
        List<Task> tasks = taskService.createTaskQuery()
            .processInstanceId(instance.getId())
            .list();
        
        assertEquals(3, tasks.size());
    }
}
```

### Performance Test Cases

```java
public class PerformanceTestSuite {
    
    @Test
    public void benchmarkProcessStart() {
        deployProcess("bpmn/performance/simple-process.bpmn");
        
        int iterations = 1000;
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < iterations; i++) {
            runtimeService.startProcessInstanceByKey("simpleProcess");
        }
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        double avgTime = (double) duration / iterations;
        
        log.info("Average process start time: {} ms", avgTime);
        
        // Assert performance threshold
        assertTrue("Process start too slow", avgTime < 100);
    }
    
    @Test
    public void benchmarkTaskCompletion() {
        deployProcess("bpmn/performance/task-process.bpmn");
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("taskProcess");
        
        Task task = taskService.createTaskQuery()
            .processInstanceId(instance.getId())
            .singleResult();
        
        int iterations = 100;
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < iterations; i++) {
            taskService.complete(task.getId());
            // Reset for next iteration
        }
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        double avgTime = (double) duration / iterations;
        
        log.info("Average task completion time: {} ms", avgTime);
        
        assertTrue("Task completion too slow", avgTime < 50);
    }
}
```

---

## Regression Testing

### Regression Test Suite

```java
@SpringBootTest
public class RegressionTestSuite {
    
    @Autowired
    private RuntimeService runtimeService;
    
    @Autowired
    private TaskService taskService;
    
    @BeforeAll
    static void setup() {
        // Setup test data
    }
    
    @Test
    void testAllRegressionCases() {
        List<String> regressionTests = Arrays.asList(
            "bpmn/regression/variable-scope.bpmn",
            "bpmn/regression/multi-instance.bpmn",
            "bpmn/regression/event-subprocess.bpmn",
            "bpmn/regression/call-activity.bpmn"
        );
        
        for (String test : regressionTests) {
            runRegressionTest(test);
        }
    }
    
    private void runRegressionTest(String bpmnFile) {
        deployProcess(bpmnFile);
        // Execute test
        // Validate results
    }
}
```

---

## Performance Testing

### Performance Benchmark

```java
public class PerformanceBenchmark {
    
    @Test
    public void benchmarkLargeProcess() {
        deployProcess("bpmn/performance/large-process.bpmn");
        
        int instances = 100;
        
        List<ProcessInstance> processInstances = new ArrayList<>();
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < instances; i++) {
            ProcessInstance instance = runtimeService
                .startProcessInstanceByKey("largeProcess");
            processInstances.add(instance);
        }
        
        long deploymentTime = System.currentTimeMillis() - startTime;
        
        // Complete all tasks
        startTime = System.currentTimeMillis();
        
        for (ProcessInstance instance : processInstances) {
            completeAllTasks(instance.getId());
        }
        
        long executionTime = System.currentTimeMillis() - startTime;
        
        log.info("Deployment time: {} ms", deploymentTime);
        log.info("Execution time: {} ms", executionTime);
    }
}
```

---

## Usage Examples

### Running Conformance Tests

```bash
# Run all conformance tests
mvn test -Dtest=BpmnConformanceTestSuite

# Run specific test
mvn test -Dtest=BpmnConformanceTestSuite#testSequentialFlow

# Run regression tests
mvn test -Dtest=RegressionTestSuite

# Run performance tests
mvn test -Dtest=PerformanceTestSuite
```

### Running in CI/CD

```yaml
# .github/workflows/test.yml
name: Conformance Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run conformance tests
        run: mvn test -Dtest=*Conformance*
      - name: Run regression tests
        run: mvn test -Dtest=*Regression*
```

---

## Best Practices

### 1. Isolate Test Data

```java
@BeforeEach
void setup() {
    // Clean up before each test
    repositoryService.createDeploymentQuery()
        .list()
        .forEach(d -> repositoryService.deleteDeployment(d.getId(), true));
}
```

### 2. Use Descriptive Test Names

```java
@Test
void testExclusiveGatewayTakesTruePathWhenConditionIsTrue() {
    // Clear test name
}
```

### 3. Validate All Outcomes

```java
@Test
void testProcessCompletion() {
    ProcessInstance instance = runtimeService
        .startProcessInstanceByKey("testProcess");
    
    assertProcessCompleted(instance.getId());
    
    // Also check history
    HistoricProcessInstance historic = historyService
        .createHistoricProcessInstanceQuery()
        .processInstanceId(instance.getId())
        .singleResult();
    
        assertNotNull(historic);
        assertEquals("COMPLETED", historic.getState());
}
```

---

## API Reference

### Key Classes

- `BpmnConformanceTest` - Base conformance test
- `ConformanceTestRunner` - Test execution
- `TestResultCollector` - Result collection
- `RegressionTestSuite` - Regression tests
- `PerformanceTestSuite` - Performance tests

### Key Methods

```java
// Test execution
void run()
TestReport generateReport()

// Test setup
void deployProcess(String resource)
void setupTestEnvironment()

// Assertions
void assertProcessCompleted(String instanceId)
void assertTaskCompleted(String taskId)
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Engine Documentation](../engine-api/README.md)
- [Spring Integration](../engine-api/spring-integration.md)
