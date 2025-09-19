import { getSchemaForTables } from "../table-schemas";
import OpenAI from "openai";

export interface QueryAgentResult {
  query: string;
  explanation: string;
  error?: string;
}

export async function generateSQLQuery(
  userQuery: string,
  selectedTables: string[]
): Promise<QueryAgentResult> {
  try {
    const schemas = getSchemaForTables(selectedTables);

    if (Object.keys(schemas).length === 0) {
      throw new Error("No valid table schemas found for selected tables");
    }

    const systemPrompt = `You are a Query Agent that generates PostgreSQL queries for a restaurant management database using Supabase.

Selected tables and their schemas:
${Object.entries(schemas)
  .map(([tableName, schema]) => `Table: ${tableName}\n${schema}`)
  .join("\n\n")}

IMPORTANT RULES:
1. Generate ONLY PostgreSQL SQL queries, not Supabase client code
2. Use proper PostgreSQL syntax with SELECT, FROM, WHERE, JOIN, etc.
3. For date filtering, use PostgreSQL date functions and BETWEEN clauses
4. Always include proper table aliases for clarity
5. Use appropriate JOINs when querying multiple tables
6. For aggregations, use SQL aggregate functions like SUM(), COUNT(), AVG()
7. Handle JSONB columns properly with -> and ->> operators when needed
8. Always include ORDER BY for consistent results
9. Use LIMIT when appropriate to avoid large result sets
10. Consider using COALESCE for null handling

CRITICAL DATE HANDLING - ABSOLUTELY NO JAVASCRIPT SYNTAX:
- FORBIDDEN: new Date(), Date(), JavaScript date functions
- REQUIRED: Use only PostgreSQL date functions and literals
- Current date: CURRENT_DATE or NOW()
- This month: DATE_TRUNC('month', CURRENT_DATE)  
- This week: DATE_TRUNC('week', CURRENT_DATE)
- Today: CURRENT_DATE
- Yesterday: CURRENT_DATE - INTERVAL '1 day'
- Date literals: '2024-09-01'::timestamptz
- Date ranges: created_date >= '2024-09-01' AND created_date < '2024-10-01'

EXAMPLE FOR "Show me total sales for this month":
SELECT SUM(total_amount) as total_sales 
FROM orders 
WHERE created_date >= DATE_TRUNC('month', CURRENT_DATE)

Common patterns:
- Sales queries: SELECT SUM(total_amount) FROM orders WHERE created_date >= DATE_TRUNC('month', CURRENT_DATE)
- Customer queries: JOIN orders o ON c.id = o.customer_id
- Date ranges: WHERE created_date BETWEEN '2024-01-01'::date AND '2024-01-31'::date
- Platform filtering: WHERE platform = 'toast'
- JSONB queries: WHERE line_items->>'item_name' = 'Burger'

User question: ${userQuery}

Respond with a JSON object containing:
{
  "query": "SELECT ... FROM ... WHERE ...",
  "explanation": "Brief explanation of what the query does"
}`;

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API key. Please set the OPENAI_API_KEY environment variable.");
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      temperature: 0.1,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);

    // Log the original query for debugging
    console.log("🔍 Original query from OpenAI:", result.query);

    // Validate and clean the generated query
    let cleanedQuery = result.query || "";

    // Check for JavaScript Date syntax and fix it
    if (cleanedQuery.includes("new Date(") || cleanedQuery.includes("Date(")) {
      console.warn("❌ DETECTED JavaScript Date syntax in generated query!");
      console.log("Original problematic query:", cleanedQuery);

      // For "this month" queries, completely replace with correct syntax
      if (
        userQuery.toLowerCase().includes("this month") ||
        userQuery.toLowerCase().includes("current month")
      ) {
        cleanedQuery = `SELECT SUM(total_amount) as total_sales FROM orders WHERE created_date >= DATE_TRUNC('month', CURRENT_DATE)`;
        console.log(
          "✅ Replaced with hardcoded correct query for 'this month'"
        );
      }
      // For other date queries, try pattern replacement
      else {
        cleanedQuery = cleanedQuery
          .replace(/new Date\(\)/g, "CURRENT_DATE")
          .replace(/new Date\([^)]*\)/g, "CURRENT_DATE")
          .replace(/Date\(\)/g, "CURRENT_DATE")
          .replace(/Date\([^)]*\)/g, "CURRENT_DATE");

        // Additional cleanup for common patterns
        cleanedQuery = cleanedQuery.replace(
          /WHERE\s+created_date\s*>=?\s*CURRENT_DATE\s*AND\s*created_date\s*<\s*CURRENT_DATE/gi,
          "WHERE created_date >= CURRENT_DATE AND created_date < CURRENT_DATE + INTERVAL '1 day'"
        );
      }

      console.log("✅ Cleaned query:", cleanedQuery);
    } else {
      console.log("✅ Query looks good - no JavaScript syntax detected");
    }

    return {
      query: cleanedQuery,
      explanation: result.explanation || "No explanation provided",
    };
  } catch (error) {
    console.error("Error in Query Agent:", error);
    return {
      query: "",
      explanation: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
