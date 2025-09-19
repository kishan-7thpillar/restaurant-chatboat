import { supabase } from "./supabase";
import { generateSupabaseQuery, QueryGenerationResult } from "./openai-service";

export interface QueryExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  query?: string;
  explanation?: string;
  executionTime?: number;
}

export async function executeNaturalLanguageQuery(
  naturalLanguageQuery: string
): Promise<QueryExecutionResult> {
  const startTime = Date.now();

  try {
    // Step 1: Generate Supabase query using OpenAI
    const queryResult: QueryGenerationResult = await generateSupabaseQuery(
      naturalLanguageQuery
    );

    if (queryResult.error) {
      return {
        success: false,
        error: `Query generation failed: ${queryResult.error}`,
        executionTime: Date.now() - startTime,
      };
    }

    if (!queryResult.query) {
      return {
        success: false,
        error: "No query was generated",
        executionTime: Date.now() - startTime,
      };
    }

    // Step 2: Parse and execute the generated query
    const executionResult = await executeGeneratedQuery(queryResult.query);

    return {
      success: executionResult.success,
      data: executionResult.data,
      error: executionResult.error,
      query: queryResult.query,
      explanation: queryResult.explanation,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      executionTime: Date.now() - startTime,
    };
  }
}

async function executeGeneratedQuery(
  queryString: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Extract the Supabase query from the generated code
    // The query should be in format: const { data, error } = await supabase.from('orders')...

    // Remove the variable declaration and await, keep just the supabase call
    let cleanQuery = queryString
      .replace(/const\s*{\s*data\s*,\s*error\s*}\s*=\s*await\s+/, "")
      .replace(/;$/, "");

    // Parse the query to build the actual Supabase call
    const result = await executeSupabaseQuery(cleanQuery);

    return {
      success: !result.error,
      data: result.data,
      error: result.error?.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query execution failed",
    };
  }
}

interface ParsedQuery {
  tableName: string;
  select?: string;
  filters: Array<{
    method: string;
    column: string;
    value: any;
  }>;
  order?: {
    column: string;
    ascending: boolean;
  };
  limit?: number;
  aggregation?: {
    type: string;
    column: string;
  };
}

async function executeSupabaseQuery(
  queryString: string
): Promise<{ data: any; error: any }> {
  try {
    // Parse and execute the query dynamically
    const parsedQuery = parseSupabaseQuery(queryString);

    if (!parsedQuery.tableName) {
      throw new Error("Could not determine table name from query");
    }

    // Build the query dynamically
    let query = supabase.from(parsedQuery.tableName);

    // Apply select - this returns a different type that has filter methods
    if (parsedQuery.select) {
      query = query.select(parsedQuery.select) as any;
    } else {
      query = query.select("*") as any;
    }

    // Apply filters
    parsedQuery.filters.forEach((filter: any) => {
      switch (filter.method) {
        case "eq":
          query = (query as any).eq(filter.column, filter.value);
          break;
        case "gte":
          query = (query as any).gte(filter.column, filter.value);
          break;
        case "lte":
          query = (query as any).lte(filter.column, filter.value);
          break;
        case "gt":
          query = (query as any).gt(filter.column, filter.value);
          break;
        case "lt":
          query = (query as any).lt(filter.column, filter.value);
          break;
        case "neq":
          query = (query as any).neq(filter.column, filter.value);
          break;
        case "like":
          query = (query as any).like(filter.column, filter.value);
          break;
        case "ilike":
          query = (query as any).ilike(filter.column, filter.value);
          break;
        case "in":
          query = (query as any).in(filter.column, filter.value);
          break;
      }
    });

    // Apply ordering
    if (parsedQuery.order) {
      query = (query as any).order(parsedQuery.order.column, {
        ascending: parsedQuery.order.ascending,
      });
    }

    // Apply limit
    if (parsedQuery.limit) {
      query = (query as any).limit(parsedQuery.limit);
    }

    // Execute the query
    const result = await (query as any);

    // Handle client-side aggregations if needed
    if (parsedQuery.aggregation) {
      return handleAggregation(result, parsedQuery.aggregation);
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error,
    };
  }
}

function parseSupabaseQuery(queryString: string): ParsedQuery {
  const parsed: ParsedQuery = {
    tableName: "",
    filters: [],
  };

  // Extract table name
  const tableMatch = queryString.match(/supabase\.from\(['"]([^'"]+)['"]\)/);
  if (tableMatch) {
    parsed.tableName = tableMatch[1];
  }

  // Extract select fields
  const selectMatch = queryString.match(/\.select\(['"]([^'"]+)['"]\)/);
  if (selectMatch) {
    parsed.select = selectMatch[1];

    // Check for aggregation patterns in select
    if (
      selectMatch[1].includes("sum(") ||
      selectMatch[1].includes("count(") ||
      selectMatch[1].includes("avg(")
    ) {
      const aggMatch = selectMatch[1].match(/(sum|count|avg)\(([^)]+)\)/);
      if (aggMatch) {
        parsed.aggregation = {
          type: aggMatch[1],
          column: aggMatch[2],
        };
        // For aggregations, we need to select the actual column
        parsed.select = aggMatch[2];
      }
    }
  }

  // Extract filters
  const filterMethods = [
    "eq",
    "gte",
    "lte",
    "gt",
    "lt",
    "neq",
    "like",
    "ilike",
    "in",
  ];

  filterMethods.forEach((method) => {
    const regex = new RegExp(
      `\\.${method}\\(['"]([^'"]+)['"],\\s*['"]?([^'"\\)]+)['"]?\\)`,
      "g"
    );
    let match;
    while ((match = regex.exec(queryString)) !== null) {
      parsed.filters.push({
        method,
        column: match[1],
        value: match[2],
      });
    }
  });

  // Extract order
  const orderMatch = queryString.match(
    /\.order\(['"]([^'"]+)['"],\s*{\s*ascending:\s*(true|false)\s*}\)/
  );
  if (orderMatch) {
    parsed.order = {
      column: orderMatch[1],
      ascending: orderMatch[2] === "true",
    };
  }

  // Extract limit
  const limitMatch = queryString.match(/\.limit\((\d+)\)/);
  if (limitMatch) {
    parsed.limit = parseInt(limitMatch[1]);
  }

  return parsed;
}

function handleAggregation(
  result: { data: any; error: any },
  aggregation: { type: string; column: string }
): { data: any; error: any } {
  if (result.error || !result.data) {
    return result;
  }

  const data = result.data;
  let aggregatedValue;

  switch (aggregation.type) {
    case "sum":
      aggregatedValue = data.reduce((total: number, row: any) => {
        return total + (parseFloat(row[aggregation.column]) || 0);
      }, 0);
      break;
    case "count":
      aggregatedValue = data.length;
      break;
    case "avg":
      const sum = data.reduce((total: number, row: any) => {
        return total + (parseFloat(row[aggregation.column]) || 0);
      }, 0);
      aggregatedValue = data.length > 0 ? sum / data.length : 0;
      break;
    default:
      aggregatedValue = data;
  }

  return {
    data: [{ [aggregation.type]: aggregatedValue }],
    error: null,
  };
}

// Format results for display
export function formatQueryResults(result: QueryExecutionResult): string {
  if (!result.success) {
    return `❌ Query failed: ${result.error}`;
  }

  let output = `✅ Query executed successfully in ${result.executionTime}ms\n\n`;

  if (result.explanation) {
    output += `📝 **Query Purpose:** ${result.explanation}\n\n`;
  }

  if (result.query) {
    output += `🔍 **Generated Query:**\n\`\`\`typescript\n${result.query}\n\`\`\`\n\n`;
  }

  if (result.data) {
    output += `📊 **Results:**\n`;

    if (Array.isArray(result.data)) {
      if (result.data.length === 0) {
        output += "No records found.";
      } else {
        output += `Found ${result.data.length} record(s):\n\n`;

        // Format as table for small datasets
        if (result.data.length <= 10) {
          const firstItem = result.data[0];
          if (typeof firstItem === "object") {
            const headers = Object.keys(firstItem);
            output += `| ${headers.join(" | ")} |\n`;
            output += `| ${headers.map(() => "---").join(" | ")} |\n`;

            result.data.forEach((item) => {
              const values = headers.map((header) => item[header] || "");
              output += `| ${values.join(" | ")} |\n`;
            });
          }
        } else {
          output += `Showing first 5 of ${result.data.length} records:\n`;
          result.data.slice(0, 5).forEach((item, index) => {
            output += `${index + 1}. ${JSON.stringify(item, null, 2)}\n`;
          });
        }
      }
    } else {
      output += JSON.stringify(result.data, null, 2);
    }
  }

  return output;
}
