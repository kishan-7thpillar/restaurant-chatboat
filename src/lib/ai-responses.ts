import { handleMultiAgentQuery } from "./multi-agent-service";

// Response type definitions
export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  borderDash?: number[];
  fill?: boolean;
  tension?: number;
  type?: string;
  yAxisID?: string;
  pointRadius?: number;
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "doughnut" | "mixed";
  labels: string[];
  datasets: ChartDataset[];
  options?: {
    stacked?: boolean;
    scales?: any;
    plugins?: any;
    responsive?: boolean;
    interaction?: any;
  };
}

export interface CardData {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral" | "positive" | "negative";
  icon?: string;
  description?: string;
}

export interface MixedSection {
  type: "text" | "table" | "chart" | "cards" | "card";
  title?: string;
  content?: string;
  data?:
    | TableData
    | ChartData
    | CardData[]
    | {
        cards?: CardData[];
        table?: TableData;
        chart?: ChartData;
        text?: string;
      };
}

// New streaming response format
export interface StreamingSection {
  type: "text" | "table" | "chart" | "cards" | "card";
  data:
    | {
        text?: string;
        headers?: string[];
        rows?: (string | number)[][];
        type?: "line" | "pie" | "bar" | "doughnut";
        labels?: string[];
        datasets?: ChartDataset[];
      }
    | ChartData
    | CardData[];
}

export interface StreamingResponse {
  sections: StreamingSection[];
}

export interface MixedData {
  mixed?: {
    sections: MixedSection[];
  };
  sections?: MixedSection[];
}

export type AIResponse =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "table";
      content: string;
      data: { table: TableData };
    }
  | {
      type: "chart";
      content: string;
      data: { chart: ChartData };
    }
  | {
      type: "card";
      content: string;
      data: { cards: CardData[] };
    }
  | {
      type: "mixed";
      content: string;
      data: MixedData;
    }
  | StreamingResponse;

// Check if query should use the multi-agent system
function shouldUseMultiAgent(message: string): boolean {
  const dataKeywords = [
    "sales",
    "revenue",
    "orders",
    "total",
    "amount",
    "customer",
    "payment",
    "august",
    "september",
    "month",
    "week",
    "today",
    "yesterday",
    "last",
    "paid",
    "pending",
    "toast",
    "square",
    "clover",
    "platform",
    "staff",
    "employee",
    "shift",
    "schedule",
    "task",
    "inventory",
    "product",
    "menu",
    "location",
    "user",
    "how many",
    "show me",
    "list",
    "find",
    "get",
  ];

  const lowerMessage = message.toLowerCase();
  return dataKeywords.some((keyword) => lowerMessage.includes(keyword));
}

// AI response system using multi-agent architecture
export const getAIResponse = async (
  message: string,
  conversationHistory?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>
): Promise<AIResponse> => {
  // Check if this query should use the multi-agent system
  console.log("🔍 Checking if query should use multi-agent system:", message);
  console.log("🔍 shouldUseMultiAgent result:", shouldUseMultiAgent(message));

  if (shouldUseMultiAgent(message)) {
    try {
      console.log("🤖 Using multi-agent system for query:", message);
      const multiAgentResult = await handleMultiAgentQuery(message);

      if (multiAgentResult.success && multiAgentResult.response) {
        return multiAgentResult.response;
      } else {
        console.error("Multi-agent query failed:", multiAgentResult.error);
        return {
          type: "text",
          content: `❌ Query failed: ${
            multiAgentResult.error || "Unknown error in multi-agent system"
          }`,
        };
      }
    } catch (error) {
      console.error("Error in multi-agent system:", error);
      return {
        type: "text",
        content: `❌ System error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
      };
    }
  }

  // For non-data queries, return a simple response
  return {
    type: "text",
    content:
      "I can help you with restaurant data queries. Try asking about sales, orders, customers, inventory, or staff information.",
  };
};
