// Demo queries to showcase the multi-agent system capabilities
export const DEMO_QUERIES = [
  {
    category: "Sales & Revenue",
    queries: [
      "Show me total sales for this month",
      "What were our sales yesterday compared to last week?",
      "Which payment methods are most popular?",
      "Show me orders by platform (Toast, Square, Clover)",
      "What's our average order value this week?"
    ]
  },
  {
    category: "Customer Analytics", 
    queries: [
      "How many customers do we have in the system?",
      "Show me customer information from Toast",
      "Which customers have the highest order values?",
      "List customers who haven't ordered in 30 days",
      "What are the most common customer locations?"
    ]
  },
  {
    category: "Staff & Scheduling",
    queries: [
      "List all employees in the system",
      "Show me today's shift schedule", 
      "Which employees worked the most hours this week?",
      "Show me staff from 7shifts platform",
      "What's our total labor cost this month?"
    ]
  },
  {
    category: "Menu & Products",
    queries: [
      "List all products in our menu",
      "What are our most expensive menu items?",
      "Show me products that are currently unavailable",
      "Which items have the highest food cost percentage?",
      "List products by category"
    ]
  },
  {
    category: "Task Management",
    queries: [
      "What tasks are currently overdue?",
      "Show me all tasks assigned to employees",
      "List completed tasks from this week",
      "Which tasks have high priority?",
      "Show me training tasks from 7shifts"
    ]
  },
  {
    category: "Inventory Management",
    queries: [
      "What items are low in stock?",
      "Show me inventory levels for all products",
      "Which items need to be reordered?",
      "List inventory by location",
      "What's our total inventory value?"
    ]
  },
  {
    category: "Location Analytics",
    queries: [
      "How many restaurant locations do we have?",
      "Show me sales by location",
      "Which location has the most employees?",
      "List all active integrations by location",
      "What's the performance comparison between locations?"
    ]
  }
];

export function getRandomDemoQuery(): string {
  const allQueries = DEMO_QUERIES.flatMap(category => category.queries);
  return allQueries[Math.floor(Math.random() * allQueries.length)];
}

export function getDemoQueriesByCategory(category: string): string[] {
  const categoryData = DEMO_QUERIES.find(c => c.category === category);
  return categoryData ? categoryData.queries : [];
}
