import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getStructuredSchemaForTables,
  StructuredTableSchema,
} from "@/lib/structured-table-schemas";

function createSystemPrompt(
  userQuery: string,
  selectedTables: string[],
  schemas: Record<string, StructuredTableSchema>
) {
  // Format schemas for the prompt
  const schemaDescriptions = Object.entries(schemas)
    .map(([tableName, schema]) => {
      const fieldsDescription = schema.fields
        .map(
          (field) =>
            `  - ${field.name}: ${field.type} (${field.description}) - Example: ${field.example}`
        )
        .join("\n");

      return `Table: ${tableName}
Description: ${schema.description}
Fields:
${fieldsDescription}`;
    })
    .join("\n\n");

  return `You are a PostgreSQL expert that generates optimized SQL queries for a restaurant management database.

Selected tables and their schemas:
${schemaDescriptions}

Generate a PostgreSQL query that answers the user's question.

IMPORTANT RULES:
1. Generate pure PostgreSQL SELECT statements only
2. Use proper PostgreSQL syntax and functions
3. For date filtering, use PostgreSQL date functions like DATE_TRUNC(), CURRENT_DATE, CURRENT_TIMESTAMP
4. Use aggregate functions (SUM, COUNT, AVG, MIN, MAX) when appropriate
5. Use proper JOINs when querying multiple tables
6. Use appropriate WHERE clauses for filtering
7. Use ORDER BY and LIMIT for sorting and limiting results
8. Use GROUP BY when using aggregate functions with non-aggregated columns
9. Handle NULL values appropriately
10. Use proper PostgreSQL date/time functions and formatting
11. CRITICAL: ONLY use field names that are explicitly listed in the schema - NEVER create, assume, or infer field names
12. For JSONB fields, do NOT assume internal structure - only use the JSONB field name itself unless the internal structure is explicitly documented in the schema
13. If a query requires accessing JSONB internal fields that are not documented in the schema, respond that the query cannot be completed with available schema information

POSTGRESQL DATE FUNCTIONS:
- Current date: CURRENT_DATE
- Current timestamp: CURRENT_TIMESTAMP  
- Start of current month: DATE_TRUNC('month', CURRENT_DATE)
- Start of current week: DATE_TRUNC('week', CURRENT_DATE)
- Start of current day: DATE_TRUNC('day', CURRENT_DATE)
- Date arithmetic: created_date >= CURRENT_DATE - INTERVAL '7 days'

EXAMPLE QUERIES:
- Total sales this month: SELECT SUM(total_amount) as total_sales FROM orders WHERE created_date >= DATE_TRUNC('month', CURRENT_DATE)
- Average order value: SELECT AVG(total_amount) as average_order_value FROM orders WHERE total_amount IS NOT NULL
- Order count by day: SELECT DATE_TRUNC('day', created_date) as day, COUNT(*) as order_count FROM orders GROUP BY DATE_TRUNC('day', created_date) ORDER BY day DESC
- Recent orders: SELECT * FROM orders ORDER BY created_date DESC LIMIT 10
- Orders with customer info: SELECT o.*, c.first_name, c.last_name FROM orders o JOIN customers c ON o.customer_id = c.id

User question: ${userQuery}

Respond with a JSON object containing:
{
  "query": "SELECT ... FROM ... WHERE ...",
  "explanation": "brief explanation of what the query does"
}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userQuery, selectedTables } = await request.json();

    if (!userQuery) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (
      !selectedTables ||
      !Array.isArray(selectedTables) ||
      selectedTables.length === 0
    ) {
      return NextResponse.json(
        { error: "Selected tables are required" },
        { status: 400 }
      );
    }

    // Get structured schemas for the selected tables
    const schemas = getStructuredSchemaForTables(selectedTables);

    if (Object.keys(schemas).length === 0) {
      return NextResponse.json(
        { error: "No valid schemas found for selected tables" },
        { status: 400 }
      );
    }

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "Missing Gemini API key. Please set the GEMINI_API_KEY environment variable."
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
      },
    });

    const prompt = `${createSystemPrompt(
      userQuery,
      selectedTables,
      schemas
    )}\n\nUser Query: ${userQuery}`;
    console.log("🚀 Prompt:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No response from Gemini");
    }

    // Extract JSON from the response
    let jsonContent = content;

    // Try to extract JSON if it's wrapped in code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonContent = jsonMatch[1].trim();
    }

    // If there's no code block, look for JSON object pattern
    if (!jsonMatch) {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonContent = objectMatch[0];
      }
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", jsonContent);
      console.error("Original response:", content);

      // Fallback: Create a simple response
      parsedResult = {
        query:
          "SELECT SUM(total_amount) as total_sales FROM orders WHERE created_date >= DATE_TRUNC('month', CURRENT_DATE)",
        explanation:
          "This query calculates the total sales for the current month.",
      };
    }

    return NextResponse.json({
      query: parsedResult.query,
      explanation: parsedResult.explanation,
    });
  } catch (error) {
    console.error("Error generating query:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
