import { NextRequest, NextResponse } from "next/server";
import { selectRelevantTables } from "@/lib/agents/table-selector-agent";

export async function POST(request: NextRequest) {
  try {
    const { userQuery } = await request.json();

    if (!userQuery) {
      return NextResponse.json({ error: "User query is required" }, { status: 400 });
    }

    console.log("🔍 Table Selector Agent - Processing query:", userQuery);

    const result = await selectRelevantTables(userQuery);

    if (result.error) {
      return NextResponse.json({
        error: `Table selection failed: ${result.error}`
      }, { status: 500 });
    }

    if (result.selectedTables.length === 0) {
      return NextResponse.json({
        error: "No relevant tables found for the query"
      }, { status: 400 });
    }

    console.log(`📋 Selected tables: ${result.selectedTables.join(', ')}`);

    return NextResponse.json({
      selectedTables: result.selectedTables,
      reasoning: result.reasoning,
      success: true
    });

  } catch (error) {
    console.error("Error in Table Selector Agent:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
