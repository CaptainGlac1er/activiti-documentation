---
sidebar_label: Data Grids
slug: /bpmn/elements/data-grid
title: "Data Grids"
description: "Using BPMN Data Grids for structured rows-and-columns tabular data in Activiti processes."
---

# Data Grids

A **Data Grid** is a BPMN data construct for modeling structured, tabular (rows-and-columns) data associated with a process or activity. It is a `ComplexDataType` variant of a data object, useful for forms and collections that need a grid layout rather than a simple value.

## Structure

A Data Grid is composed of rows, and each row is composed of fields (name/value pairs):

```java
DataGrid grid = new DataGrid();

DataGridRow row = new DataGridRow();
row.addField(new DataGridField("name", "John Doe"));
row.addField(new DataGridField("email", "john@example.com"));
grid.getRows().add(row);
```

### Model Classes

| Class | Description |
|-------|-------------|
| `DataGrid` | A grid of `DataGridRow`s; implements `ComplexDataType` |
| `DataGridRow` | A single row; holds a list of `DataGridField`s |
| `DataGridField` | A name/value pair within a row |

> **Note:** `DataGrid` is a complex data type used to represent structured tabular data (form/table definitions) within the BPMN model.

## Related Documentation

- [Data Objects and Data Stores](./data-objects.md) — single-value and store-based data modeling
- [Process Extensions](../reference/process-extensions.md) — form and variable modeling that use grids
- [Integration](../integration/index.md) — connectors that pass structured data

---
