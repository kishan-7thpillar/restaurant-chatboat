import { AIResponse, TableData, ChartData, CardData } from "../ai-responses";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ResponseParserResult {
  response: AIResponse;
  error?: string;
}

// Helper function to optimize large table data
function optimizeTableData(tableData: any): TableData {
  // Make a copy to avoid modifying the original
  const data = JSON.parse(JSON.stringify(tableData));

  // If the table has too many columns, select only the most important ones
  if (data.headers && data.headers.length > 10) {
    // Priority columns to keep (updated for better data display)
    const priorityColumns = [
      "id",
      "platform",
      "first_name",
      "last_name",
      "role",
      "hourly_wage",
      "total_paid",
      "total_amount",
      "subtotal_amount",
      "customer_first_name",
      "customer_last_name",
      "created_date",
      "location_id",
    ];

    // Find indices of priority columns
    const priorityIndices: number[] = [];
    priorityColumns.forEach((col) => {
      const index = data.headers.indexOf(col);
      if (index !== -1) priorityIndices.push(index);
    });

    // If we have some priority columns, filter the data
    if (priorityIndices.length > 0) {
      // Filter headers
      const newHeaders = priorityIndices.map((i) => data.headers[i]);

      // Filter rows
      const newRows = data.rows.map((row: any[]) =>
        priorityIndices.map((i) => row[i])
      );

      return {
        headers: newHeaders,
        rows: newRows.slice(0, 20), // Limit to 20 rows
      };
    }
  }

  // If we have too many rows, limit them
  if (data.rows && data.rows.length > 20) {
    data.rows = data.rows.slice(0, 20);
  }

  // Simplify complex objects in cells
  if (data.rows) {
    data.rows = data.rows.map((row: any[]) =>
      row.map((cell: any) => {
        // Handle arrays of objects
        if (
          Array.isArray(cell) &&
          cell.length > 0 &&
          typeof cell[0] === "object"
        ) {
          return `[${cell.length} items]`;
        }
        // Handle objects
        if (cell !== null && typeof cell === "object" && !Array.isArray(cell)) {
          return JSON.stringify(cell).substring(0, 30) + "...";
        }
        return cell;
      })
    );
  }

  return data;
}

// Enhanced fallback function to create attractive mixed responses
function createEnhancedFallbackResponse(
  userQuery: string,
  sqlResults: any[],
  queryExplanation: string
): AIResponse {
  if (!sqlResults || sqlResults.length === 0) {
    return {
      type: "text",
      content:
        "No data found for your query. Please try adjusting your search criteria or check if the data exists.",
    };
  }

  const columns = Object.keys(sqlResults[0]);
  const queryLower = userQuery.toLowerCase();

  // Detect numerical columns
  const numericalColumns = columns.filter((col) =>
    sqlResults.some((row) => typeof row[col] === "number" && !isNaN(row[col]))
  );

  // Detect if this should be a mixed format response
  const shouldUseMixedFormat =
    numericalColumns.length > 0 &&
    (queryLower.includes("analysis") ||
      queryLower.includes("summary") ||
      queryLower.includes("report") ||
      queryLower.includes("overview") ||
      queryLower.includes("dashboard") ||
      queryLower.includes("metrics") ||
      queryLower.includes("performance") ||
      queryLower.includes("cost") ||
      queryLower.includes("sales") ||
      queryLower.includes("revenue") ||
      queryLower.includes("total") ||
      sqlResults.length >= 5);

  if (shouldUseMixedFormat) {
    // Create cards from numerical data
    const cards = [];
    const seenTitles = new Set();

    // Generate summary cards
    for (const col of numericalColumns.slice(0, 4)) {
      const values = sqlResults
        .map((row) => row[col])
        .filter((val) => typeof val === "number");
      if (values.length === 0) continue;

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);

      const title = col
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);

      let value = sum;
      let description = `Average: ${avg.toFixed(2)}`;

      // If it's a rate/percentage column, use average instead of sum
      if (
        col.toLowerCase().includes("rate") ||
        col.toLowerCase().includes("percent")
      ) {
        value = avg;
        description = `Range: ${Math.min(...values).toFixed(2)} - ${max.toFixed(
          2
        )}`;
      }

      // Format value
      let formattedValue = value.toString();
      if (
        col.toLowerCase().includes("amount") ||
        col.toLowerCase().includes("cost") ||
        col.toLowerCase().includes("price")
      ) {
        formattedValue = `$${value.toFixed(2)}`;
      } else if (col.toLowerCase().includes("percent")) {
        formattedValue = `${value.toFixed(1)}%`;
      } else if (value > 1000000) {
        formattedValue = `${(value / 1000000).toFixed(1)}M`;
      } else if (value > 1000) {
        formattedValue = `${(value / 1000).toFixed(1)}K`;
      }

      // Select appropriate icon
      let icon = "BarChart3";
      if (
        col.toLowerCase().includes("sales") ||
        col.toLowerCase().includes("revenue")
      )
        icon = "DollarSign";
      else if (col.toLowerCase().includes("cost")) icon = "TrendingDown";
      else if (col.toLowerCase().includes("profit")) icon = "TrendingUp";
      else if (
        col.toLowerCase().includes("count") ||
        col.toLowerCase().includes("total")
      )
        icon = "Hash";
      else if (
        col.toLowerCase().includes("rate") ||
        col.toLowerCase().includes("percent")
      )
        icon = "Percent";

      cards.push({
        title,
        value: formattedValue,
        description,
        icon,
        trend:
          values.length > 1
            ? values[values.length - 1] > values[0]
              ? "up"
              : "down"
            : "neutral",
      });
    }

    // Generate chart data for time series or categorical data
    let chartData = null;
    const dateCol = columns.find(
      (col) =>
        col.toLowerCase().includes("date") ||
        col.toLowerCase().includes("time") ||
        col.toLowerCase().includes("created")
    );

    if (dateCol && numericalColumns.length > 0 && sqlResults.length > 2) {
      const labels = sqlResults.map((row) => {
        const dateValue = row[dateCol];
        if (typeof dateValue === "string") {
          // Try to format date nicely
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
          return dateValue.substring(0, 10); // Take first 10 chars
        }
        return dateValue?.toString() || "";
      });

      chartData = {
        type: "line" as const,
        labels: labels.slice(0, 10), // Limit to 10 points
        datasets: numericalColumns.slice(0, 2).map((col, index) => ({
          label: col
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          data: sqlResults.slice(0, 10).map((row) => row[col] || 0),
          borderColor: index === 0 ? "#3b82f6" : "#ef4444",
          backgroundColor:
            index === 0 ? "rgba(59, 130, 246, 0.1)" : "rgba(239, 68, 68, 0.1)",
        })),
      };
    }

    // Generate key insights
    const insights = [];
    insights.push(`• Total records analyzed: ${sqlResults.length}`);

    if (numericalColumns.length > 0) {
      const col = numericalColumns[0];
      const values = sqlResults
        .map((row) => row[col])
        .filter((val) => typeof val === "number");
      if (values.length > 0) {
        const max = Math.max(...values);
        const min = Math.min(...values);
        insights.push(`• Highest ${col.replace(/_/g, " ")}: ${max}`);
        if (max !== min) {
          insights.push(`• Range: ${min} - ${max}`);
        }
      }
    }

    // Add query-specific insights
    if (queryLower.includes("today") || queryLower.includes("recent")) {
      insights.push("• Showing most recent data available");
    }
    if (queryLower.includes("top") || queryLower.includes("best")) {
      insights.push("• Results sorted by performance");
    }

    // Build sections
    const sections = [];

    if (cards.length > 0) {
      sections.push({
        type: "cards",
        title: "Key Metrics Overview",
        data: cards,
      });
    }

    if (chartData) {
      sections.push({
        type: "chart",
        title: "Trend Analysis",
        data: chartData,
      });
    }

    sections.push({
      type: "text",
      title: "Key Insights",
      content: insights.join("\n"),
    });

    // Add detailed table if not too many records
    if (sqlResults.length <= 15) {
      const optimizedTable = optimizeTableData({
        headers: columns,
        rows: sqlResults.map((row) => columns.map((col) => row[col] || "")),
      });

      sections.push({
        type: "table",
        title: "Detailed Breakdown",
        data: optimizedTable,
      });
    }

    return {
      type: "mixed",
      content: `${userQuery} - Complete Analysis`,
      data: {
        mixed: {
          sections,
        },
      },
    };
  }

  // Fallback to optimized table
  const optimizedTable = optimizeTableData({
    headers: columns,
    rows: sqlResults.map((row) => columns.map((col) => row[col] || "")),
  });

  return {
    type: "table",
    content: `${userQuery} - Results (${sqlResults.length} records)`,
    data: {
      table: optimizedTable,
    },
  };
}

export async function parseQueryResults(
  userQuery: string,
  sqlResults: any[],
  queryExplanation: string
): Promise<ResponseParserResult> {
  try {
    console.log("🔍 Response Parser Debug:");
    console.log("User Query:", userQuery);
    console.log("Query Explanation:", queryExplanation);
    console.log(
      "SQL Results Sample:",
      JSON.stringify(sqlResults.slice(0, 2), null, 2)
    );
    console.log("SQL Results Length:", sqlResults.length);

    if (!sqlResults || sqlResults.length === 0) {
      return {
        response: {
          type: "text",
          content:
            "No data found for your query. The database returned no results.",
        },
      };
    }

    const systemPrompt = `You are a Response Parser Agent that converts SQL query results into structured UI-ready JSON format for a restaurant management chatbot. Your goal is to create VISUALLY ATTRACTIVE and INTERACTIVE responses that encourage user engagement.

User's original question: ${userQuery}
Query explanation: ${queryExplanation}
Number of records returned: ${sqlResults.length}

Sample of the data (first 3 records):
${JSON.stringify(sqlResults.slice(0, 3), null, 2)}

ANALYZE THE DATA and choose the MOST APPROPRIATE response format based on:
- Data type and structure
- Number of records
- Presence of numerical/analytical data
- User query intent

Available response formats (choose the best one):

1. "mixed" - Multi-section responses with cards, charts, text, and tables
   Use for: Analysis, dashboards, reports, complex data with multiple insights

2. "card" - Key metrics as attractive cards with icons and trends
   Use for: Summary metrics, KPIs, single or few key values

3. "chart" - Data visualizations (bar, line, pie, doughnut)
   Use for: Time series, comparisons, trends, categorical data

4. "table" - Tabular data with headers and rows
   Use for: Lists, detailed records, structured data without clear metrics

5. "text" - Simple text responses
   Use for: Basic information, explanations, error messages

CRITICAL: Follow these EXACT data structures for each format:

For "mixed" type responses (PRIORITIZE THIS FORMAT):
{
  "type": "mixed",
  "content": "Descriptive title - Analysis/Report/Dashboard",
  "data": {
    "mixed": {
      "sections": [
        {
          "type": "cards",
          "title": "Key Metrics",
          "data": [
            {
              "title": "Total Revenue",
              "value": "$12,450",
              "change": "+8.2%",
              "trend": "up",
              "icon": "DollarSign",
              "description": "This month vs last month"
            }
          ]
        },
        {
          "type": "chart", 
          "title": "Trend Analysis",
          "data": {
            "type": "line",
            "labels": ["Week 1", "Week 2", "Week 3"],
            "datasets": [
              {
                "label": "Sales",
                "data": [1200, 1500, 900],
                "borderColor": "#3b82f6",
                "backgroundColor": "rgba(59, 130, 246, 0.1)"
              }
            ]
          }
        },
        {
          "type": "text",
          "title": "Key Insights",
          "content": "• Revenue increased 8.2% this period\\n• Peak sales on Wednesdays\\n• Customer satisfaction up 12%"
        }
      ]
    }
  }
}

For "card" type responses:
{
  "type": "card",
  "content": "Brief summary",
  "data": {
    "cards": [
      {
        "title": "Total Sales",
        "value": "$181.85",
        "description": "Total sales for the current month",
        "icon": "DollarSign",
        "trend": "up",
        "change": "+5.2%"
      }
    ]
  }
}

For "chart" type responses:
{
  "type": "chart",
  "content": "Brief summary", 
  "data": {
    "chart": {
      "type": "bar",
      "labels": ["Week 1", "Week 2", "Week 3"],
      "datasets": [
        {
          "label": "Sales",
          "data": [1200, 1500, 900],
          "backgroundColor": ["#3B82F6", "#10B981", "#F59E0B"],
          "borderColor": "#1F2937",
          "borderWidth": 1
        }
      ]
    }
  }
}

For "table" type responses:
{
  "type": "table", 
  "content": "Brief summary",
  "data": {
    "table": {
      "headers": ["Order ID", "Amount", "Date"],
      "rows": [["12345", 181.85, "2025-09-15"], ["12346", 95.50, "2025-09-16"]]
    }
  }
}

For "text" type responses:
{
  "type": "text",
  "content": "Simple text explanation or information"
}

ENHANCED GUIDELINES FOR ATTRACTIVE UI:

ICONS TO USE:
- Sales/Revenue: "DollarSign", "TrendingUp"
- Costs/Expenses: "TrendingDown", "DollarSign" 
- Orders/Count: "ShoppingCart", "Hash"
- Customers: "Users", "User"
- Performance: "Target", "Award"
- Time/Dates: "Clock", "Calendar"
- Percentages: "Percent"
- Products: "Package", "Box"
- Locations: "MapPin", "Building"

TREND INDICATORS:
- Always include "trend": "up"/"down"/"neutral" for cards
- Add "change": "+5.2%" or "-3.1%" when comparing periods
- Use green/red color psychology in descriptions

CHART TYPES:
- Line charts: Time series, trends over time
- Bar charts: Category comparisons, rankings
- Pie/Doughnut: Parts of whole, percentages
- Colors: Use ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"] palette

MIXED FORMAT SECTIONS:
1. Cards section: Always start with key metrics (3-6 cards max)
2. Chart section: Add if you have time-series or comparative data  
3. Text section: Key insights, recommendations, observations
4. Table section: Detailed data (only if ≤15 records)

KEY INSIGHTS TO GENERATE:
- Performance trends ("Sales up 15% this week")
- Notable patterns ("Peak orders on weekends") 
- Comparisons ("Best performing location: Downtown")
- Actionable insights ("Consider lunch promotions")
- Data highlights ("Processed 247 orders today")

CONTENT TITLES:
Make them descriptive and engaging:
- "Sales Performance Dashboard - This Week"
- "Customer Analysis - Top Performers" 
- "Revenue Trends - Monthly Breakdown"
- "Operational Metrics - Current Period"

FORMAT SELECTION DECISION TREE:

1. Choose "mixed" when:
   - Multiple types of insights can be extracted
   - Data has both summary metrics AND detailed records
   - Query asks for analysis, dashboard, report, or overview
   - 3+ records with numerical data that can be visualized
   - Complex business data (sales, costs, performance)

2. Choose "card" when:
   - Data represents key metrics or KPIs
   - Few important values to highlight (1-6 metrics)
   - Query asks for totals, counts, or summary statistics
   - Single record with multiple important fields

3. Choose "chart" when:
   - Data shows trends over time
   - Comparing categories or groups
   - Showing parts of a whole (percentages)
   - Clear numerical relationships to visualize

4. Choose "table" when:
   - Data is primarily informational/reference
   - No clear numerical insights or trends
   - User wants to see detailed records
   - Simple list or directory-style data

5. Choose "text" when:
   - No data returned or error occurred
   - Simple explanatory response needed
   - Data doesn't fit other formats

DECISION PRIORITY: mixed > card > chart > table > text

Remember: Analyze the data structure and user intent to select the format that provides the most value and engagement!`;

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Missing Gemini API key, using enhanced fallback");
      return {
        response: createEnhancedFallbackResponse(
          userQuery,
          sqlResults,
          queryExplanation
        ),
        error: "Missing API key - using enhanced fallback format",
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
      },
    });

    const prompt = `${systemPrompt}\n\nFormat this data for an attractive, engaging UI: ${JSON.stringify(
      sqlResults
    )}`;

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

      // Use enhanced fallback instead of basic table
      console.log("Using enhanced fallback response format");
      return {
        response: createEnhancedFallbackResponse(
          userQuery,
          sqlResults,
          queryExplanation
        ),
        error: "JSON parsing failed - using enhanced fallback format",
      };
    }

    // Validate the response structure
    if (!parsedResult.type || !parsedResult.content) {
      throw new Error("Invalid response format from parser agent");
    }

    // Optimize large table data if present in any section
    if (parsedResult.type === "table" && parsedResult.data?.table) {
      parsedResult.data.table = optimizeTableData(parsedResult.data.table);
      if (sqlResults.length > 20) {
        parsedResult.content = `${parsedResult.content} (showing ${parsedResult.data.table.rows.length} of ${sqlResults.length} records)`;
      }
    }

    // Optimize tables within mixed format sections
    if (parsedResult.type === "mixed" && parsedResult.data?.mixed?.sections) {
      parsedResult.data.mixed.sections = parsedResult.data.mixed.sections.map(
        (section) => {
          if (section.type === "table" && section.data) {
            section.data = optimizeTableData(section.data);
          }
          return section;
        }
      );
    }

    return {
      response: parsedResult as AIResponse,
    };
  } catch (error) {
    console.error("Error in Response Parser Agent:", error);

    // Use enhanced fallback instead of basic table format
    if (sqlResults && sqlResults.length > 0) {
      console.log("Using enhanced fallback due to error");
      return {
        response: createEnhancedFallbackResponse(
          userQuery,
          sqlResults,
          queryExplanation
        ),
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }

    return {
      response: {
        type: "text",
        content:
          "We encountered an issue processing your query results. Please try again or contact support if the problem persists.",
      },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
