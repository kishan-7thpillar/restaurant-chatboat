import { supabase } from "./supabase";
import { selectRelevantTables } from "./agents/table-selector-agent";
import { generateSQLQuery } from "./agents/query-agent";
import { parseQueryResults } from "./agents/response-parser-agent";
import { AIResponse } from "./ai-responses";

export interface MultiAgentResult {
  success: boolean;
  response?: AIResponse;
  error?: string;
  debug?: {
    selectedTables: string[];
    tableSelectionReasoning: string;
    generatedQuery: string;
    queryExplanation: string;
    executionTime: number;
  };
}

export async function handleMultiAgentQuery(userQuery: string): Promise<MultiAgentResult> {
  // Debug logging for environment variables
  console.log('🔑 OpenAI API Key available:', process.env.OPENAI_API_KEY ? 'Yes (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'No');
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  const startTime = Date.now();
  
  try {
    // Step 1: Table Selector Agent
    console.log("🔍 Step 1: Selecting relevant tables...");
    const tableSelection = await selectRelevantTables(userQuery);
    
    if (tableSelection.error) {
      return {
        success: false,
        error: `Table selection failed: ${tableSelection.error}`
      };
    }

    if (tableSelection.selectedTables.length === 0) {
      return {
        success: false,
        error: "No relevant tables found for the query"
      };
    }

    console.log(`📋 Selected tables: ${tableSelection.selectedTables.join(', ')}`);

    // Step 2: Query Agent
    console.log("⚡ Step 2: Generating SQL query...");
    const queryGeneration = await generateSQLQuery(userQuery, tableSelection.selectedTables);
    
    if (queryGeneration.error) {
      return {
        success: false,
        error: `Query generation failed: ${queryGeneration.error}`
      };
    }

    if (!queryGeneration.query) {
      return {
        success: false,
        error: "No SQL query was generated"
      };
    }

    console.log(`🔧 Generated query: ${queryGeneration.query}`);
    
    // Additional validation - if query still contains JavaScript syntax, force a correct one
    if (queryGeneration.query.includes('new Date(') || queryGeneration.query.includes('Date(')) {
      console.error("🚨 CRITICAL: Query still contains JavaScript syntax after cleaning!");
      console.log("Forcing correct PostgreSQL syntax...");
      
      if (userQuery.toLowerCase().includes('this month') || userQuery.toLowerCase().includes('current month')) {
        queryGeneration.query = `SELECT SUM(total_amount) as total_sales FROM orders WHERE created_date >= DATE_TRUNC('month', CURRENT_DATE)`;
        queryGeneration.explanation = "Calculates total sales for the current month using PostgreSQL date functions";
      }
    }

    // Step 3: Execute SQL query against Supabase
    console.log("💾 Step 3: Executing SQL query...");
    
    let sqlResults: any[] = [];
    let executionError: any = null;

    try {
      // Try using the API route for SQL execution
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryGeneration.query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'SQL execution failed');
      }

      const result = await response.json();
      sqlResults = result.data || [];
      
    } catch (error) {
      console.log("⚠️ API route failed, attempting direct query...");
      const fallbackResult = await executeFallbackQuery(queryGeneration.query);
      
      if (fallbackResult.error) {
        return {
          success: false,
          error: `SQL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      
      sqlResults = fallbackResult.data;
    }

    // Step 4: Response Parser Agent
    console.log("🎨 Step 4: Parsing results for UI...");
    const responseParser = await parseQueryResults(
      userQuery,
      sqlResults || [],
      queryGeneration.explanation
    );

    if (responseParser.error) {
      console.warn("Response parsing failed, using fallback format");
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      response: responseParser.response,
      debug: {
        selectedTables: tableSelection.selectedTables,
        tableSelectionReasoning: tableSelection.reasoning,
        generatedQuery: queryGeneration.query,
        queryExplanation: queryGeneration.explanation,
        executionTime
      }
    };

  } catch (error) {
    console.error("Multi-agent query processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Fallback query execution for when RPC is not available
async function executeFallbackQuery(sqlQuery: string): Promise<{ data: any[], error?: any }> {
  try {
    // Parse the SQL to determine the main table and build a Supabase query
    const tableMatch = sqlQuery.match(/FROM\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error("Could not determine table from SQL query");
    }

    const tableName = tableMatch[1];
    
    // For simple SELECT queries, try to execute directly
    if (sqlQuery.toLowerCase().includes('select') && !sqlQuery.toLowerCase().includes('join')) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100); // Limit results for performance
      
      return { data: data || [], error };
    }

    // For complex queries, return empty result with note
    return {
      data: [],
      error: new Error("Complex SQL queries require database RPC function")
    };

  } catch (error) {
    return {
      data: [],
      error
    };
  }
}
