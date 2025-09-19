"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Star,
  MessageSquare,
  Package,
  ClipboardList,
  Receipt,
  Lightbulb,
  ShoppingCart,
  CreditCard,
  Target,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  AIResponse,
  TableData,
  ChartData,
  CardData,
  StreamingResponse,
  StreamingSection,
} from "@/lib/ai-responses";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ResponseRendererProps {
  response: AIResponse;
}

const IconMap = {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Star,
  MessageSquare,
  Package,
  ClipboardList,
  Receipt,
  Lightbulb,
  ShoppingCart,
  CreditCard,
  Target,
  BarChart3,
  PieChart,
  Activity,
};

// Enhanced icon mapping for different card types
const cardIconMap = {
  sales: DollarSign,
  revenue: DollarSign,
  tax: Receipt,
  tip: Lightbulb,
  orders: ShoppingCart,
  payment: CreditCard,
  customers: Users,
  users: Users,
  target: Target,
  performance: BarChart3,
  analytics: PieChart,
  activity: Activity,
  inventory: Package,
  tasks: ClipboardList,
  alerts: AlertTriangle,
  time: Clock,
  success: CheckCircle,
  rating: Star,
  messages: MessageSquare,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
};

function TableRenderer({ data }: { data: TableData }) {
  // Helper function to safely render cell content
  const renderCellContent = (cell: any): React.ReactNode => {
    if (cell === null || cell === undefined) {
      return "";
    }

    // Handle different types of cell content
    if (
      typeof cell === "string" ||
      typeof cell === "number" ||
      typeof cell === "boolean"
    ) {
      return String(cell);
    }

    // Handle arrays
    if (Array.isArray(cell)) {
      if (cell.length === 0) return "[]";
      return "[...] " + cell.length + " items";
    }

    // Handle objects
    if (typeof cell === "object") {
      return "{ ... }";
    }

    // Fallback
    return String(cell);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-slate-200 dark:border-slate-700 rounded-lg">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            {data.headers.map((header, index) => (
              <th
                key={index}
                className="border border-slate-200 dark:border-slate-700 px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-600 dark:text-slate-400"
                >
                  {renderCellContent(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Chart.js renderer with full Chart.js integration
function ChartRenderer({ data }: { data: ChartData }) {
  // Default chart options with responsive settings
  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y ?? context.parsed;
            // Format currency values
            if (
              typeof value === "number" &&
              (label.toLowerCase().includes("sales") ||
                label.toLowerCase().includes("revenue") ||
                label.toLowerCase().includes("tax") ||
                label.toLowerCase().includes("tip"))
            ) {
              return `${label}: $${value.toLocaleString()}`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales:
      data.type !== "pie" && data.type !== "doughnut"
        ? {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
              ticks: {
                callback: function (value: any) {
                  // Format currency on y-axis for sales data
                  if (
                    typeof value === "number" &&
                    data.datasets.some(
                      (d) =>
                        d.label?.toLowerCase().includes("sales") ||
                        d.label?.toLowerCase().includes("revenue") ||
                        d.label?.toLowerCase().includes("tax") ||
                        d.label?.toLowerCase().includes("tip")
                    )
                  ) {
                    return "$" + value.toLocaleString();
                  }
                  return value;
                },
              },
            },
            x: {
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
          }
        : undefined,
    ...data.options,
  };

  // Prepare chart data with enhanced styling
  const prepareDatasets = (datasets: any[], chartType: string) => {
    return datasets.map((dataset, index) => {
      const baseDataset = {
        ...dataset,
        backgroundColor:
          dataset.backgroundColor ||
          [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
          ][index % 6],
        borderColor:
          dataset.borderColor ||
          [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(236, 72, 153, 1)",
          ][index % 6],
        borderWidth: dataset.borderWidth || 2,
      };

      // Remove the type property to avoid conflicts with Chart.js typing
      const { type, ...cleanDataset } = baseDataset;
      return cleanDataset;
    });
  };

  const chartData = {
    labels: data.labels,
    datasets: prepareDatasets(data.datasets, data.type),
  };

  const containerClass = "w-full h-64 md:h-80";

  return (
    <div className="space-y-4">
      <div className={containerClass}>
        {data.type === "bar" && (
          <Bar data={chartData as any} options={defaultOptions} />
        )}
        {data.type === "line" && (
          <Line data={chartData as any} options={defaultOptions} />
        )}
        {data.type === "pie" && (
          <Pie data={chartData as any} options={defaultOptions} />
        )}
        {data.type === "doughnut" && (
          <Doughnut data={chartData as any} options={defaultOptions} />
        )}
      </div>
    </div>
  );
}

function PieChartRenderer({ data }: { data: ChartData }) {
  const dataset = data.datasets[0];
  const total = dataset.data.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart Visualization */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transform -rotate-90"
            >
              {dataset.data.map((value, index) => {
                const percentage = (value / total) * 100;
                const angle = (value / total) * 360;
                const prevAngles = dataset.data
                  .slice(0, index)
                  .reduce((sum, v) => sum + (v / total) * 360, 0);
                const startAngle = prevAngles;
                const endAngle = prevAngles + angle;

                const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                const largeArcFlag = angle > 180 ? 1 : 0;
                const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                const backgroundColor = Array.isArray(dataset.backgroundColor)
                  ? dataset.backgroundColor[index]
                  : dataset.backgroundColor || "#3b82f6";

                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={backgroundColor}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">
            {dataset.label}
          </h4>
          {data.labels.map((label, index) => {
            const value = dataset.data[index];
            const percentage = ((value / total) * 100).toFixed(1);
            const backgroundColor = Array.isArray(dataset.backgroundColor)
              ? dataset.backgroundColor[index]
              : dataset.backgroundColor || "#3b82f6";

            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor }} />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GroupedBarChartRenderer({ data }: { data: ChartData }) {
  const maxValue = Math.max(...data.datasets.flatMap((d) => d.data));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300">
          {data.datasets.map((d) => d.label).join(" vs ")}
        </h4>
        <div className="flex space-x-4 text-xs">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[0]
                    : dataset.backgroundColor || "#3b82f6",
                }}
              />
              <span className="text-slate-600 dark:text-slate-400">
                {dataset.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {data.labels.map((label, index) => (
          <div key={index} className="space-y-2">
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {label}
            </div>
            <div className="flex space-x-2">
              {data.datasets.map((dataset, datasetIndex) => {
                const value = dataset.data[index];
                const percentage = (value / maxValue) * 100;
                const backgroundColor = Array.isArray(dataset.backgroundColor)
                  ? dataset.backgroundColor[0]
                  : dataset.backgroundColor || "#3b82f6";

                return (
                  <div key={datasetIndex} className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{dataset.label}</span>
                      <span className="font-medium">${value}</span>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-4 relative">
                      <div
                        className="h-full rounded-full flex items-center justify-center"
                        style={{
                          width: `${Math.max(percentage, 5)}%`,
                          backgroundColor,
                        }}
                      >
                        <span className="text-xs font-medium text-white">
                          ${value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced card renderer with improved design and icon mapping
function CardRenderer({ cards }: { cards: CardData[] }) {
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;

    // Check if it's an emoji (Unicode character)
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName)) {
      // Return emoji as a span element
      return () => <span className="text-lg">{iconName}</span>;
    }

    // Try card-specific icon mapping first
    const cardIcon =
      cardIconMap[iconName.toLowerCase() as keyof typeof cardIconMap];
    if (cardIcon) return cardIcon;

    // Fallback to general icon mapping
    const generalIcon = IconMap[iconName as keyof typeof IconMap];
    if (generalIcon) return generalIcon;

    return null;
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
      case "positive":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800";
      case "down":
      case "negative":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800";
      case "neutral":
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const IconComponent = getIconComponent(card.icon);
        const trendColorClass = getTrendColor(card.trend);

        return (
          <Card
            key={index}
            className="relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="truncate">{card.title}</span>
                {IconComponent && (
                  <div className="flex-shrink-0 p-2 rounded-lg bg-slate-50 dark:bg-slate-700">
                    <IconComponent className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Main Value */}
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {card.value}
                </div>

                {/* Change Indicator */}
                {card.change && (
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={`px-2 py-1 text-xs font-medium border ${trendColorClass}`}
                    >
                      <div className="flex items-center space-x-1">
                        {card.trend === "up" || card.trend === "positive" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : card.trend === "down" ||
                          card.trend === "negative" ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        <span>{card.change}</span>
                      </div>
                    </Badge>
                  </div>
                )}

                {/* Description */}
                {card.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Helper function to validate and fix response format if needed
function validateResponseFormat(
  response: Exclude<AIResponse, StreamingResponse>
): Exclude<AIResponse, StreamingResponse> {
  // Make a deep copy to avoid modifying the original
  const validatedResponse = JSON.parse(JSON.stringify(response));

  // Check if table data is directly in data instead of data.table
  if (
    validatedResponse.type === "table" &&
    validatedResponse.data &&
    !validatedResponse.data.table &&
    Array.isArray(validatedResponse.data.headers)
  ) {
    // Fix: data has direct TableData structure instead of { table: TableData }
    validatedResponse.data = { table: validatedResponse.data };
  }

  // Check if chart data is directly in data instead of data.chart
  if (
    validatedResponse.type === "chart" &&
    validatedResponse.data &&
    !validatedResponse.data.chart &&
    validatedResponse.data.type
  ) {
    // Fix: data has direct ChartData structure instead of { chart: ChartData }
    validatedResponse.data = { chart: validatedResponse.data };
  }

  // Check if card data is directly in data instead of data.cards
  if (
    validatedResponse.type === "card" &&
    validatedResponse.data &&
    !validatedResponse.data.cards
  ) {
    // If it's a single card object
    if (validatedResponse.data.title && validatedResponse.data.value) {
      validatedResponse.data = { cards: [validatedResponse.data] };
    }
    // If it's an array of cards
    else if (Array.isArray(validatedResponse.data)) {
      validatedResponse.data = { cards: validatedResponse.data };
    }
  }

  return validatedResponse;
}

// Helper function to check if response is streaming format
function isStreamingResponse(
  response: AIResponse
): response is StreamingResponse {
  return "sections" in response && Array.isArray(response.sections);
}

// Simple markdown renderer for text content
function renderMarkdownText(text: string) {
  // Convert markdown to JSX elements
  return text
    .split("\n")
    .map((line, index) => {
      // Handle headers
      if (line.startsWith("### ")) {
        return (
          <h3
            key={index}
            className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2"
          >
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2"
          >
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1
            key={index}
            className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2"
          >
            {line.replace("# ", "")}
          </h1>
        );
      }

      // Handle list items
      if (line.startsWith("- ")) {
        const content = line.replace("- ", "");
        // Handle bold text within list items
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="text-slate-500 dark:text-slate-400 mr-2">•</span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {parts.map((part, partIndex) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong
                      key={partIndex}
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </span>
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\./.test(line)) {
        const content = line.replace(/^\d+\.\s*/, "");
        const number = line.match(/^(\d+)\./)?.[1];
        // Handle bold text within numbered items
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="text-slate-500 dark:text-slate-400 mr-2 font-medium">
              {number}.
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {parts.map((part, partIndex) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong
                      key={partIndex}
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </span>
          </div>
        );
      }

      // Handle regular text with bold formatting
      if (
        line.trim() &&
        !line.startsWith("#") &&
        !line.startsWith("-") &&
        !/^\d+\./.test(line)
      ) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p
            key={index}
            className="text-sm text-slate-700 dark:text-slate-300 mb-2"
          >
            {parts.map((part, partIndex) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong
                    key={partIndex}
                    className="font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      }

      // Empty lines
      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }

      return null;
    })
    .filter(Boolean);
}

// Enhanced component to render streaming sections with full Chart.js support
function StreamingSectionRenderer({
  section,
  index,
}: {
  section: StreamingSection;
  index: number;
}) {
  return (
    <div className="space-y-4">
      {section.type === "text" && section.data && "text" in section.data && (
        <div className="leading-relaxed">
          {renderMarkdownText(section.data.text || "")}
        </div>
      )}

      {section.type === "table" &&
        section.data &&
        "headers" in section.data &&
        "rows" in section.data && (
          <TableRenderer
            data={{
              headers: section.data.headers || [],
              rows: section.data.rows || [],
            }}
          />
        )}

      {(section.type === "cards" || section.type === "card") && Array.isArray(section.data) && (
        <CardRenderer cards={section.data} />
      )}

      {section.type === "chart" && section.data && (
        <div className="space-y-2">{renderChart(section, index)}</div>
      )}
    </div>
  );
}

// Enhanced chart renderer for streaming sections
function renderChart(section: StreamingSection, index: number) {
  const data = section.data;

  // Handle direct ChartData structure
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "type" in data &&
    "labels" in data &&
    "datasets" in data
  ) {
    return <ChartRenderer data={data as ChartData} />;
  }

  // Handle data structure with chart properties at root level
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("type" in data || "labels" in data || "datasets" in data)
  ) {
    const chartData: ChartData = {
      type: (data as any).type || "bar",
      labels: (data as any).labels || [],
      datasets: (data as any).datasets || [],
    };
    return <ChartRenderer data={chartData} />;
  }

  // Fallback for invalid chart data
  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <p className="text-sm text-yellow-700 dark:text-yellow-300">
        ⚠️ Invalid chart data format
      </p>
    </div>
  );
}

// Enhanced cards renderer for streaming sections
function renderCards(section: StreamingSection, index: number) {
  if (!Array.isArray(section.data)) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ Invalid cards data format
        </p>
      </div>
    );
  }

  return <CardRenderer cards={section.data} />;
}

export default function ResponseRenderer({ response }: ResponseRendererProps) {
  // Handle new streaming response format with enhanced section rendering
  if (isStreamingResponse(response)) {
    return (
      <div className="space-y-8">
        {response.sections.map((section, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
          >
            <StreamingSectionRenderer section={section} index={index} />
          </div>
        ))}
      </div>
    );
  }

  // Handle legacy response format
  const validatedResponse = validateResponseFormat(
    response as Exclude<AIResponse, StreamingResponse>
  );

  return (
    <div className="space-y-4">
      {/* Content Title */}
      <div className="font-semibold text-slate-800 dark:text-slate-200">
        {validatedResponse.content}
      </div>

      {/* Render based on response type */}
      {validatedResponse.type === "text" && (
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
          {validatedResponse.content}
        </div>
      )}

      {validatedResponse.type === "table" && validatedResponse.data?.table && (
        <TableRenderer data={validatedResponse.data.table} />
      )}

      {validatedResponse.type === "chart" && validatedResponse.data?.chart && (
        <ChartRenderer data={validatedResponse.data.chart} />
      )}

      {validatedResponse.type === "card" && validatedResponse.data?.cards && (
        <CardRenderer cards={validatedResponse.data.cards} />
      )}

      {validatedResponse.type === "mixed" &&
        (validatedResponse.data?.mixed || validatedResponse.data?.sections) && (
          <div className="space-y-6">
            {/* Handle both data.mixed.sections and data.sections structures */}
            {(
              validatedResponse.data.mixed?.sections ||
              validatedResponse.data.sections
            )?.map((section: any, index: number) => (
              <div key={index} className="space-y-3">
                {section.title && (
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">
                    {section.title}
                  </h4>
                )}

                {section.type === "text" && section.content && (
                  <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {section.content}
                  </div>
                )}

                {/* Handle both "card" and "cards" types */}
                {(section.type === "card" || section.type === "cards") && (
                  <>
                    {/* Handle data.cards structure */}
                    {section.data?.cards &&
                      Array.isArray(section.data.cards) && (
                        <CardRenderer cards={section.data.cards} />
                      )}
                    {/* Handle direct array structure */}
                    {Array.isArray(section.data) && (
                      <CardRenderer cards={section.data} />
                    )}
                  </>
                )}

                {section.type === "table" && (
                  <>
                    {/* Handle data.table structure */}
                    {section.data?.table && "headers" in section.data.table && (
                      <TableRenderer data={section.data.table as TableData} />
                    )}
                    {/* Handle direct table structure */}
                    {section.data &&
                      "headers" in section.data &&
                      !section.data.table && (
                        <TableRenderer data={section.data as TableData} />
                      )}
                  </>
                )}

                {section.type === "chart" && (
                  <>
                    {/* Handle data.chart structure */}
                    {section.data?.chart && "type" in section.data.chart && (
                      <ChartRenderer data={section.data.chart as ChartData} />
                    )}
                    {/* Handle direct chart structure */}
                    {section.data &&
                      "type" in section.data &&
                      !section.data.chart && (
                        <ChartRenderer data={section.data as ChartData} />
                      )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
