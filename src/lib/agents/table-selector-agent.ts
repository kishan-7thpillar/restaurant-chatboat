import { getTableMetadataForSelector } from "../table-metadata";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface TableSelectorResult {
  selectedTables: string[];
  reasoning: string;
  error?: string;
}

export async function selectRelevantTables(
  userQuery: string
): Promise<TableSelectorResult> {
  try {
    const tableMetadata = getTableMetadataForSelector();

    const systemPrompt = `You are a Table Selector Agent for a restaurant management database. Your job is to analyze user queries and determine which tables are needed to answer them.

Available tables and their descriptions:
${tableMetadata
  .map(
    (table) =>
      `- ${table.title}: ${
        table.description
      }\n  Relationships: ${table.relationships.join(", ")}`
  )
  .join("\n")}

Rules:
1. Select only the tables that are directly needed to answer the user's question
2. Consider relationships between tables when multiple tables might be needed
3. Be conservative - don't select unnecessary tables
4. Always include location-related tables if the query involves specific locations
5. For sales/revenue queries, you'll typically need orders and possibly customers
6. For staff/employee queries, you'll need users and possibly shifts
7. For inventory queries, you'll need inventory and possibly products
8. For task management queries, you'll need tasks and possibly users

Respond with a JSON object containing:
{
  "selectedTables": ["table1", "table2"],
  "reasoning": "Brief explanation of why these tables were selected"
}`;

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "Missing Gemini API key. Please set the GEMINI_API_KEY environment variable."
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Set up the model with specific generation config
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
      },
    });

    const prompt = `${systemPrompt}\n\nUser Query: ${userQuery}`;

    // Generate content with the prompt
    const result = await model.generateContent(prompt);

    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No response from Gemini");
    }

    // Extract JSON from the response
    // Sometimes Gemini wraps the JSON in markdown code blocks or adds explanatory text
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
    }

    return {
      selectedTables: parsedResult.selectedTables || [],
      reasoning: parsedResult.reasoning || "No reasoning provided",
    };
  } catch (error) {
    console.error("Error in Table Selector Agent:", error);
    return {
      selectedTables: [],
      reasoning: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
