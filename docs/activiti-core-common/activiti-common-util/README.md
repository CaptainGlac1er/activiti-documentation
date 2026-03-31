# Activiti Common Util Module - Technical Documentation

**Module:** `activiti-core-common/activiti-common-util`

**Target Audience:** Senior Software Engineers, Application Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [DateFormatterProvider](#dateformatterprovider)
- [Auto-Configuration](#auto-configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **activiti-common-util** module provides essential utility classes for date formatting, parsing, and conversion across the Activiti platform. It offers a centralized, configurable approach to handling date/time operations with support for multiple date types and timezone-aware processing.

### Key Features

- **Date Formatting & Parsing**: Flexible date pattern support
- **Type Conversion**: Convert between various date/time types
- **Timezone Awareness**: ZoneId support for proper timezone handling
- **Spring Boot Integration**: Auto-configuration with customizable patterns
- **Thread-Safe**: Utilities designed for concurrent use
- **Exception Handling**: Robust error handling for invalid dates

### Module Structure

```
activiti-common-util/
└── src/main/java/org/activiti/common/util/
    ├── DateFormatterProvider.java              # Main date utility
    └── conf/
        └── ActivitiCoreCommonUtilAutoConfiguration.java  # Spring auto-config
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Date Utilities                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          DateFormatterProvider                       │   │
│  │        (Central Date Utility)                        │   │
│  │                                                      │   │
│  │  Configuration:                                     │   │
│  │  - dateFormatPattern: String                        │   │
│  │  - zoneId: ZoneId (default: UTC)                    │   │
│  │                                                      │   │
│  │  Operations:                                        │   │
│  │  - parse(String) → Date                             │   │
│  │  - toDate(Object) → Date                            │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ configured by                       │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   ActivitiCoreCommonUtilAutoConfiguration           │   │
│  │         (Spring Boot Auto-Config)                    │   │
│  │                                                      │   │
│  │  - Creates DateFormatterProvider bean               │   │
│  │  - Reads spring.activiti.date-format-pattern       │   │
│  │  - Conditional on missing bean                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Date Conversion Flow

```
Input Object
    │
    ▼
┌─────────────────────────────┐
│  toDate(Object value)       │
│  Type Check                  │
└──────────┬──────────────────┘
           │
    ┌──────┼──────┬───────────┬────────────┬───────────┐
    │      │      │           │            │           │
    ▼      ▼      ▼           ▼            ▼           ▼
 String  Date   Long    LocalDate   LocalDateTime  ZonedDateTime
    │      │      │           │            │           │
    │      │      │           │            │           │
    ▼      ▼      ▼           ▼            ▼           ▼
 parse()  return  new Date()  atStartOfDay  atZone     toInstant()
    │      │      │           │            │           │
    └──────┴──────┴───────────┴────────────┴───────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Date      │
                    │  (Result)    │
                    └──────────────┘
```

---

## Key Classes and Their Responsibilities

### DateFormatterProvider

**Purpose:** Central utility for date formatting, parsing, and type conversion.

**Responsibilities:**
- Parse date strings using configurable patterns
- Convert various date/time types to `java.util.Date`
- Handle timezone-aware operations
- Provide flexible date pattern support
- Manage default timezone (UTC)

**Configuration:**
- `dateFormatPattern`: Date format pattern (default: `yyyy-MM-dd[['T']HH:mm:ss[.SSS][XXX]]`)
- `zoneId`: Timezone for date operations (default: `ZoneOffset.UTC`)

**Supported Input Types:**
- `String` - Parsed using configured pattern
- `Date` - Returned as-is
- `Long` - Converted from milliseconds
- `LocalDate` - Converted with timezone
- `LocalDateTime` - Converted with timezone
- `ZonedDateTime` - Converted to instant

**When to Use:** For all date parsing and conversion operations in Activiti applications.

**Design Pattern:** Provider pattern with configurable behavior

**Thread Safety:** Thread-safe (immutable configuration after construction)

**Example:**
```java
@Autowired
private DateFormatterProvider dateFormatterProvider;

public Date parseDate(String dateStr) {
    return dateFormatterProvider.parse(dateStr);
}

public Date convertToDate(Object value) {
    return dateFormatterProvider.toDate(value);
}
```

---

### ActivitiCoreCommonUtilAutoConfiguration

**Purpose:** Spring Boot auto-configuration for date utilities.

**Responsibilities:**
- Create `DateFormatterProvider` bean
- Configure date format pattern from properties
- Enable conditional bean creation
- Integrate with Spring context

**Configuration Properties:**
- `spring.activiti.date-format-pattern`: Custom date format pattern

**When to Use:** Automatically applied when module is on classpath.

**Design Pattern:** Auto-configuration pattern

**Example:**
```yaml
# application.yml
spring:
  activiti:
    date-format-pattern: "yyyy-MM-dd HH:mm:ss"
```

---

## DateFormatterProvider

### Date Parsing

```java
public class DateFormatterProvider {
    
    private String dateFormatPattern;
    private ZoneId zoneId = ZoneOffset.UTC;
    
    /**
     * Parse a date string using the configured pattern.
     * 
     * @param value The date string to parse
     * @return Parsed Date object
     * @throws DateTimeException if parsing fails
     */
    public Date parse(String value) throws DateTimeException {
        DateTimeFormatter dateTimeFormatter = new DateTimeFormatterBuilder()
            .appendPattern(getDateFormatPattern())
            .toFormatter()
            .withZone(getZoneId());
        
        try {
            // Try parsing as ZonedDateTime first
            ZonedDateTime zonedDateTime = dateTimeFormatter.parse(value, ZonedDateTime::from);
            return Date.from(zonedDateTime.toInstant());
        } catch (DateTimeException e) {
            // Fall back to LocalDate parsing
            LocalDate localDate = dateTimeFormatter.parse(String.valueOf(value), LocalDate::from);
            return Date.from(localDate.atStartOfDay().atZone(getZoneId()).toInstant());
        }
    }
}
```

### Type Conversion

```java
/**
 * Convert various object types to Date.
 * 
 * Supported types:
 * - String: Parsed using configured pattern
 * - Date: Returned as-is
 * - Long: Converted from milliseconds timestamp
 * - LocalDate: Converted with timezone
 * - LocalDateTime: Converted with timezone
 * - ZonedDateTime: Converted to instant
 * 
 * @param value The object to convert
 * @return Converted Date object
 * @throws DateTimeException if conversion fails
 */
public Date toDate(Object value) {
    if (value instanceof String) {
        return parse((String) value);
    }
    
    if (value instanceof Date) {
        return (Date) value;
    }
    
    if (value instanceof Long) {
        return new Date((long) value);
    }
    
    if (value instanceof LocalDate) {
        return Date.from(((LocalDate) value).atStartOfDay(getZoneId()).toInstant());
    }
    
    if (value instanceof LocalDateTime) {
        return Date.from(((LocalDateTime) value).atZone(getZoneId()).toInstant());
    }
    
    if (value instanceof ZonedDateTime) {
        return Date.from(((ZonedDateTime) value).toInstant());
    }
    
    throw new DateTimeException(
        MessageFormat.format("Error while parsing date. Type: {0}, value: {1}", 
            value.getClass().getName(), value)
    );
}
```

### Configuration

```java
public class DateFormatterProvider {
    
    public DateFormatterProvider(String dateFormatPattern) {
        this.dateFormatPattern = dateFormatPattern;
    }
    
    public String getDateFormatPattern() {
        return dateFormatPattern;
    }
    
    public void setDateFormatPattern(String dateFormatPattern) {
        this.dateFormatPattern = dateFormatPattern;
    }
    
    public ZoneId getZoneId() {
        return zoneId;
    }
    
    public void setZoneId(ZoneId zoneId) {
        this.zoneId = zoneId;
    }
}
```

---

## Auto-Configuration

### Spring Boot Integration

```java
@AutoConfiguration
public class ActivitiCoreCommonUtilAutoConfiguration {
    
    /**
     * Auto-configure DateFormatterProvider bean.
     * 
     * @param dateFormatPattern Pattern from spring.activiti.date-format-property
     * @return Configured DateFormatterProvider
     */
    @Bean
    @ConditionalOnMissingBean
    public DateFormatterProvider dateFormatterProvider(
            @Value("${spring.activiti.date-format-pattern:yyyy-MM-dd[['T']HH:mm:ss[.SSS][XXX]]}")
            String dateFormatPattern) {
        return new DateFormatterProvider(dateFormatPattern);
    }
}
```

### Custom Configuration

```java
@Configuration
public class CustomDateConfig {
    
    /**
     * Override default date format pattern.
     */
    @Bean
    public DateFormatterProvider customDateFormatterProvider() {
        DateFormatterProvider provider = new DateFormatterProvider("dd/MM/yyyy HH:mm:ss");
        provider.setZoneId(ZoneId.of("America/New_York"));
        return provider;
    }
}
```

---

## Usage Examples

### Basic Date Parsing

```java
@Service
public class DateParsingService {
    
    @Autowired
    private DateFormatterProvider dateFormatterProvider;
    
    public Date parseIsoDate(String isoDate) {
        // "2024-01-15T10:30:00.000Z"
        return dateFormatterProvider.parse(isoDate);
    }
    
    public Date parseSimpleDate(String simpleDate) {
        // "2024-01-15"
        return dateFormatterProvider.parse(simpleDate);
    }
}
```

### Converting Various Types

```java
@Service
public class DateConversionService {
    
    @Autowired
    private DateFormatterProvider dateFormatterProvider;
    
    public void convertAllTypes() {
        // String to Date
        Date fromString = dateFormatterProvider.toDate("2024-01-15T10:30:00Z");
        
        // Date to Date (no-op)
        Date fromDate = dateFormatterProvider.toDate(new Date());
        
        // Long (timestamp) to Date
        Date fromLong = dateFormatterProvider.toDate(1705312200000L);
        
        // LocalDate to Date
        Date fromLocalDate = dateFormatterProvider.toDate(LocalDate.of(2024, 1, 15));
        
        // LocalDateTime to Date
        Date fromLocalDateTime = dateFormatterProvider.toDate(
            LocalDateTime.of(2024, 1, 15, 10, 30)
        );
        
        // ZonedDateTime to Date
        Date fromZonedDateTime = dateFormatterProvider.toDate(
            ZonedDateTime.of(2024, 1, 15, 10, 30, 0, 0, ZoneOffset.UTC)
        );
    }
}
```

### Custom Date Format

```java
@Configuration
public class DateFormatConfig {
    
    @Bean
    public DateFormatterProvider usDateFormatProvider() {
        DateFormatterProvider provider = new DateFormatterProvider("MM/dd/yyyy HH:mm:ss");
        provider.setZoneId(ZoneId.of("America/New_York"));
        return provider;
    }
}

@Service
public class UsDateService {
    
    @Autowired
    @Qualifier("usDateFormatProvider")
    private DateFormatterProvider dateFormatterProvider;
    
    public Date parseUsDate(String usDate) {
        // "01/15/2024 10:30:00"
        return dateFormatterProvider.parse(usDate);
    }
}
```

### Handling Process Variables

```java
@Component
public class ProcessVariableDateHandler {
    
    @Autowired
    private DateFormatterProvider dateFormatterProvider;
    
    public void handleProcessVariable(String variableName, Object value) {
        // Convert process variable to Date
        Date dateValue = dateFormatterProvider.toDate(value);
        
        // Use in process logic
        processEngine.setVariable(variableName, dateValue);
    }
    
    public boolean isDateBeforeToday(Object dateValue) {
        Date date = dateFormatterProvider.toDate(dateValue);
        Date today = new Date();
        return date.before(today);
    }
}
```

### Timezone-Aware Operations

```java
@Service
public class TimezoneAwareDateService {
    
    @Autowired
    private DateFormatterProvider dateFormatterProvider;
    
    public Date parseWithTimezone(String dateStr, String timezone) {
        // Temporarily change timezone
        ZoneId originalZone = dateFormatterProvider.getZoneId();
        dateFormatterProvider.setZoneId(ZoneId.of(timezone));
        
        try {
            return dateFormatterProvider.parse(dateStr);
        } finally {
            // Restore original timezone
            dateFormatterProvider.setZoneId(originalZone);
        }
    }
    
    public Date convertToUtc(String dateStr, String sourceTimezone) {
        DateFormatterProvider provider = new DateFormatterProvider(
            dateFormatterProvider.getDateFormatPattern()
        );
        provider.setZoneId(ZoneId.of(sourceTimezone));
        
        Date sourceDate = provider.parse(dateStr);
        
        // Convert to UTC
        provider.setZoneId(ZoneOffset.UTC);
        return provider.toDate(sourceDate);
    }
}
```

### Error Handling

```java
@Service
public class SafeDateService {
    
    @Autowired
    private DateFormatterProvider dateFormatterProvider;
    
    public Optional<Date> safeParse(String dateStr) {
        try {
            Date date = dateFormatterProvider.parse(dateStr);
            return Optional.of(date);
        } catch (DateTimeException e) {
            log.warn("Failed to parse date: {}", dateStr, e);
            return Optional.empty();
        }
    }
    
    public Date parseWithDefault(String dateStr, Date defaultValue) {
        try {
            return dateFormatterProvider.parse(dateStr);
        } catch (DateTimeException e) {
            log.debug("Using default date for invalid input: {}", dateStr);
            return defaultValue;
        }
    }
    
    public Date convertWithValidation(Object value) {
        if (value == null) {
            throw new IllegalArgumentException("Date value cannot be null");
        }
        
        try {
            return dateFormatterProvider.toDate(value);
        } catch (DateTimeException e) {
            throw new IllegalArgumentException(
                "Invalid date format for value: " + value, e);
        }
    }
}
```

---

## Best Practices

### 1. Use ISO 8601 Format

```java
// GOOD - ISO 8601 (default)
// Pattern: yyyy-MM-dd[['T']HH:mm:ss[.SSS][XXX]]
DateFormatterProvider provider = new DateFormatterProvider(
    "yyyy-MM-dd[['T']HH:mm:ss[.SSS][XXX]]"
);

// BAD - Ambiguous format
DateFormatterProvider provider = new DateFormatterProvider("MM/dd/yyyy");
```

### 2. Always Specify Timezone

```java
// GOOD - Explicit timezone
DateFormatterProvider provider = new DateFormatterProvider(pattern);
provider.setZoneId(ZoneId.of("America/New_York"));

// BAD - Relying on system default
// Uses system timezone which may vary
```

### 3. Handle Parsing Exceptions

```java
// GOOD - Try-catch for parsing
try {
    Date date = dateFormatterProvider.parse(userInput);
    processDate(date);
} catch (DateTimeException e) {
    log.error("Invalid date format: {}", userInput, e);
    throw new BadRequestException("Invalid date");
}

// BAD - No error handling
Date date = dateFormatterProvider.parse(userInput);
```

### 4. Use toDate() for Flexible Input

```java
// GOOD - Handles multiple types
public void setDateVariable(Object value) {
    Date date = dateFormatterProvider.toDate(value);
    repository.save(date);
}

// BAD - Assumes String input
public void setDateVariable(String value) {
    Date date = dateFormatterProvider.parse(value);
    repository.save(date);
}
```

### 5. Configure Pattern Once

```java
// GOOD - Central configuration
@Configuration
public class DateConfig {
    @Bean
    public DateFormatterProvider dateFormatterProvider() {
        return new DateFormatterProvider("yyyy-MM-dd HH:mm:ss");
    }
}

// BAD - Multiple configurations
@Service
public class Service1 {
    private DateFormatterProvider provider1 = new DateFormatterProvider("pattern1");
}

@Service
public class Service2 {
    private DateFormatterProvider provider2 = new DateFormatterProvider("pattern2");
}
```

---

## API Reference

### DateFormatterProvider

**Constructor:**

```java
public DateFormatterProvider(String dateFormatPattern)
```

**Configuration Methods:**

```java
/**
 * Get the date format pattern.
 */
public String getDateFormatPattern();

/**
 * Set the date format pattern.
 */
public void setDateFormatPattern(String dateFormatPattern);

/**
 * Get the timezone for date operations.
 */
public ZoneId getZoneId();

/**
 * Set the timezone for date operations.
 */
public void setZoneId(ZoneId zoneId);
```

**Parsing Methods:**

```java
/**
 * Parse a date string using the configured pattern.
 * 
 * @param value The date string to parse
 * @return Parsed Date object
 * @throws DateTimeException if parsing fails
 */
public Date parse(String value) throws DateTimeException;

/**
 * Convert various object types to Date.
 * 
 * @param value The object to convert (String, Date, Long, LocalDate, 
 *              LocalDateTime, ZonedDateTime)
 * @return Converted Date object
 * @throws DateTimeException if conversion fails
 */
public Date toDate(Object value);
```

---

### ActivitiCoreCommonUtilAutoConfiguration

**Bean Methods:**

```java
/**
 * Auto-configure DateFormatterProvider bean.
 * 
 * @param dateFormatPattern Pattern from spring.activiti.date-format-pattern
 * @return Configured DateFormatterProvider
 */
@Bean
@ConditionalOnMissingBean
public DateFormatterProvider dateFormatterProvider(String dateFormatPattern);
```

---

## Configuration Properties

### Default Pattern

```
spring.activiti.date-format-pattern=yyyy-MM-dd[['T']HH:mm:ss[.SSS][XXX]]
```

This pattern supports:
- Full ISO 8601: `2024-01-15T10:30:00.000Z`
- Date only: `2024-01-15`
- Date with time: `2024-01-15 10:30:00`
- With milliseconds: `2024-01-15T10:30:00.123`
- With timezone: `2024-01-15T10:30:00+05:30`

### Custom Pattern Examples

```yaml
# US format
spring.activiti.date-format-pattern: "MM/dd/yyyy HH:mm:ss"

# European format
spring.activiti.date-format-pattern: "dd/MM/yyyy HH:mm:ss"

# Simple date only
spring.activiti.date-format-pattern: "yyyy-MM-dd"

# With milliseconds
spring.activiti.date-format-pattern: "yyyy-MM-dd HH:mm:ss.SSS"
```

---

## Troubleshooting

### DateTimeException: Text '2024-01-15' could not be parsed

**Problem:** Date string doesn't match configured pattern

**Solution:**
1. Check the configured date format pattern
2. Ensure date string matches pattern
3. Use flexible pattern with optional components

```yaml
# Use pattern that accepts both date and datetime
spring.activiti.date-format-pattern: "yyyy-MM-dd[['T']HH:mm:ss[.SSS][XXX]]"
```

### Timezone Mismatch

**Problem:** Dates appear in wrong timezone

**Solution:**
1. Explicitly set timezone in DateFormatterProvider
2. Use UTC as default for consistency
3. Convert to local timezone only for display

```java
DateFormatterProvider provider = new DateFormatterProvider(pattern);
provider.setZoneId(ZoneOffset.UTC);  // Always use UTC internally
```

### Null Pointer Exception on toDate()

**Problem:** Passing null to toDate()

**Solution:**
1. Check for null before conversion
2. Use Optional for safe conversion
3. Provide default value

```java
public Date safeToDate(Object value) {
    if (value == null) {
        return null;  // or return defaultValue
    }
    return dateFormatterProvider.toDate(value);
}
```

### Unsupported Type Exception

**Problem:** Passing unsupported type to toDate()

**Solution:**
1. Check supported types before conversion
2. Convert to supported type first
3. Add custom type handling

```java
public Date convert(Object value) {
    if (value instanceof MyCustomDate) {
        value = ((MyCustomDate) value).toInstant();
    }
    return dateFormatterProvider.toDate(value);
}
```

---

## Supported Date Types

| Input Type | Description | Example |
|------------|-------------|---------|
| `String` | Parsed using configured pattern | `"2024-01-15T10:30:00Z"` |
| `Date` | Returned as-is | `new Date()` |
| `Long` | Milliseconds since epoch | `1705312200000L` |
| `LocalDate` | Date without time | `LocalDate.of(2024, 1, 15)` |
| `LocalDateTime` | Date with time, no timezone | `LocalDateTime.of(2024, 1, 15, 10, 30)` |
| `ZonedDateTime` | Full date-time with timezone | `ZonedDateTime.now()` |

---

## See Also

- [Parent Module Documentation](../README.md)
- [Spring Application](../activiti-spring-application/README.md)
- [Expression Language](../activiti-expression-language/README.md)
