import { NextRequest, NextResponse } from "next/server";
import { parseQueryResults } from "@/lib/agents/response-parser-agent";

export async function POST(request: NextRequest) {
  try {
    const { userQuery, sqlResults, queryExplanation } = await request.json();

    if (!userQuery) {
      return NextResponse.json(
        { error: "User query is required" },
        { status: 400 }
      );
    }

    if (!sqlResults) {
      return NextResponse.json(
        { error: "SQL results are required" },
        { status: 400 }
      );
    }

    console.log(
      "🎨 Response Parser Agent - Processing results for query:",
      userQuery
    );
    console.log(
      "📊 Number of results:",
      Array.isArray(sqlResults) ? sqlResults.length : "Not an array"
    );

    const result = await parseQueryResults(
      userQuery,
      sqlResults || [],
      queryExplanation || "Query executed successfully"
    );

    if (result.error) {
      console.warn(
        "Response parsing failed, using fallback format:",
        result.error
      );
    }

    return NextResponse.json({
      response: result.response,
      success: true,
      error: result.error || null,
    });
  } catch (error) {
    console.error("Error in Response Parser Agent:", error);

    // Fallback to simple table format if possible
    try {
      const { sqlResults } = await request.json();
      if (sqlResults && Array.isArray(sqlResults) && sqlResults.length > 0) {
        const headers = Object.keys(sqlResults[0]);
        const rows = sqlResults.map((row) =>
          headers.map((header) => row[header] || "")
        );

        return NextResponse.json({
          response: {
            type: "table",
            content: `Query Results (${sqlResults.length} records)`,
            data: {
              table: {
                headers,
                rows,
              },
            },
          },
          success: true,
          error: "Response parsing failed, using fallback format",
        });
      }
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
    }

    return NextResponse.json(
      {
        response: {
          type: "text",
          content: "Error parsing query results",
        },
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
