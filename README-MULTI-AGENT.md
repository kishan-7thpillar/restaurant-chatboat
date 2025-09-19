# Multi-Agent Chatbot Query Handling System

This document describes the implementation of a three-agent system for handling restaurant management database queries in the chatbot application.

## Architecture Overview

The system splits query handling into three specialized agents, each with a specific responsibility:

```
User Query → Table Selector → Query Agent → SQL Execution → Response Parser → UI Response
```

## Agent Responsibilities

### 1. Table Selector Agent (`src/lib/agents/table-selector-agent.ts`)

**Input:**
- User's natural language query
- Table metadata (title, description, relationships only)

**Task:**
- Analyze the query to determine which database tables are needed
- Consider table relationships for complex queries

**Output:**
- List of relevant table names
- Reasoning for table selection

**Example:**
```typescript
// Input: "Show me total sales for this month"
// Output: { selectedTables: ["orders"], reasoning: "Orders table contains sales data with amounts and dates" }
```

### 2. Query Agent (`src/lib/agents/query-agent.ts`)

**Input:**
- User's original query
- Selected table names from Table Selector
- Full PostgreSQL schemas for selected tables only

**Task:**
- Generate optimized PostgreSQL queries
- Handle complex JOINs, aggregations, and filtering

**Output:**
- Executable SQL query
- Explanation of what the query does

**Example:**
```typescript
// Input: "Show me total sales for this month" + orders schema
// Output: { 
//   query: "SELECT SUM(total_amount) as total_sales FROM orders WHERE created_date >= '2024-09-01'",
//   explanation: "Calculates total sales from orders created this month"
// }
```

### 3. Response Parser Agent (`src/lib/agents/response-parser-agent.ts`)

**Input:**
- User's original query
- Raw SQL query results
- Query explanation

**Task:**
- Format results into UI-ready JSON structures
- Choose appropriate visualization (text, table, chart, card, mixed)

**Output:**
- Structured `AIResponse` object matching UI interface

**Example:**
```typescript
// Input: SQL results with sales data
// Output: {
//   type: "card",
//   content: "Monthly Sales Summary",
//   data: { cards: [{ title: "Total Sales", value: "$45,230", trend: "up" }] }
// }
```

## File Structure

```
src/lib/
├── agents/
│   ├── table-selector-agent.ts    # Agent 1: Table selection
│   ├── query-agent.ts             # Agent 2: SQL generation  
│   ├── response-parser-agent.ts   # Agent 3: Response formatting
│   ├── demo-queries.ts            # Sample queries for testing
│   └── test-multi-agent.ts        # Test suite
├── table-metadata.ts              # Table descriptions & relationships
├── table-schemas.ts               # PostgreSQL schemas
├── multi-agent-service.ts         # Main orchestration service
└── ai-responses.ts                # Updated to use multi-agent system
```

## Supported Tables

The system supports all restaurant management tables:

| Table | Description | Key Relationships |
|-------|-------------|-------------------|
| `orders` | Customer orders from POS systems | → customers, locations |
| `customers` | Customer information | → orders, locations |
| `users` | Employee/staff data | → shifts, tasks, locations |
| `products` | Menu items and products | → inventory, locations |
| `shifts` | Employee schedules | → users, locations |
| `tasks` | Task management | → users, locations |
| `inventory` | Stock levels | → products, locations |
| `locations` | Restaurant locations | ← all other tables |
| `integrations` | System configurations | → locations |

## Usage Examples

### Basic Sales Query
```typescript
const result = await handleMultiAgentQuery("What were our sales yesterday?");
// Returns formatted card/chart with sales data
```

### Complex Multi-Table Query
```typescript
const result = await handleMultiAgentQuery("Show me top customers by order value this month");
// Automatically selects orders + customers tables
// Generates JOIN query
// Returns formatted table with customer rankings
```

### Staff Analytics
```typescript
const result = await handleMultiAgentQuery("Which employees worked the most hours this week?");
// Selects users + shifts tables
// Calculates total hours per employee
// Returns ranked list
```

## Response Formats

The system supports multiple UI response formats:

### Text Response
```typescript
{
  type: "text",
  content: "Simple text answer or explanation"
}
```

### Table Response
```typescript
{
  type: "table", 
  content: "Table title",
  data: {
    table: {
      headers: ["Column 1", "Column 2"],
      rows: [["Value 1", "Value 2"]]
    }
  }
}
```

### Chart Response
```typescript
{
  type: "chart",
  content: "Chart title", 
  data: {
    chart: {
      type: "bar|line|pie|doughnut",
      labels: ["Label 1", "Label 2"],
      datasets: [{ label: "Dataset", data: [10, 20] }]
    }
  }
}
```

### Card Response
```typescript
{
  type: "card",
  content: "Metrics summary",
  data: {
    cards: [{
      title: "Total Sales",
      value: "$45,230", 
      trend: "up",
      change: "+12%"
    }]
  }
}
```

### Mixed Response
```typescript
{
  type: "mixed",
  content: "Complex analysis",
  data: {
    mixed: {
      sections: [
        { type: "text", content: "Summary..." },
        { type: "chart", data: chartData },
        { type: "table", data: tableData }
      ]
    }
  }
}
```

## Error Handling

The system includes comprehensive error handling:

1. **Table Selection Errors**: Falls back to legacy system
2. **SQL Generation Errors**: Returns error message with context
3. **SQL Execution Errors**: Attempts fallback query execution
4. **Response Parsing Errors**: Falls back to simple table format

## Performance Considerations

- **Caching**: Table metadata and schemas are cached in memory
- **Query Limits**: Automatic LIMIT clauses prevent large result sets
- **Fallback Execution**: Simple queries use direct Supabase client calls
- **Async Processing**: All agents run asynchronously with proper error handling

## Testing

Use the demo queries to test different scenarios:

```typescript
import { testMultiAgentSystem } from './agents/test-multi-agent';
import { DEMO_QUERIES } from './agents/demo-queries';

// Run comprehensive tests
await testMultiAgentSystem();

// Test specific categories
const salesQueries = getDemoQueriesByCategory("Sales & Revenue");
```

## Integration

The multi-agent system integrates seamlessly with the existing chatbot:

1. **Automatic Detection**: Queries with data keywords trigger multi-agent processing
2. **Fallback Support**: Legacy system handles non-data queries
3. **UI Compatibility**: All response formats match existing UI components
4. **Debug Information**: Detailed logging and debug data for troubleshooting

## Future Enhancements

- **Query Caching**: Cache frequent query results
- **Advanced Analytics**: Time-series analysis and forecasting
- **Natural Language Explanations**: More detailed response explanations
- **Query Optimization**: Automatic query performance optimization
- **Real-time Data**: Live dashboard updates and notifications
