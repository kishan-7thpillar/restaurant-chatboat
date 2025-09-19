// Table metadata for the Table Selector Agent
export interface TableMetadata {
  name: string;
  title: string;
  description: string;
  relationships: string[];
}

export const AVAILABLE_TABLES: TableMetadata[] = [
  {
    name: "orders",
    title: "Orders",
    description:
      "Customer orders from Toast, Square, and Clover POS systems. Contains order details, amounts, and customer info.",
    relationships: [
      "customers (customer_id)",
      "locations (location_id)",
      "products (via line_items JSONB)",
      "payments (order_id)",
      "inventory_logs (order_id)",
      "order_line_items (order_id)",
    ],
  },
  {
    name: "customers",
    title: "Customers",
    description:
      "Customer information from Toast, Square, and Clover systems. Includes contact details, addresses, and customer preferences.",
    relationships: ["orders (customer_id)", "locations (location_id)"],
  },
  {
    name: "users",
    title: "Users/Employees",
    description:
      "Employee and user data from Toast, Square, Clover, and 7shifts. Contains staff information, roles, wages, and employment details.",
    relationships: [
      "shifts (user_id)",
      "tasks (assigned_to)",
      "locations (location_id)",
      "inventory_logs (performed_by)",
    ],
  },
  {
    name: "products",
    title: "Products/Menu Items",
    description:
      "Menu items and products from Toast, Square, and Clover. Includes pricing, categories, modifiers, and inventory details.",
    relationships: [
      "inventory (product_id)",
      "orders (via line_items JSONB)",
      "locations (location_id)",
      "product_ingredients (product_id)",
      "product_ingredients (ingridiant_id)",
      "inventory_logs (product_id)",
    ],
  },
  {
    name: "shifts",
    title: "Employee Shifts",
    description:
      "Employee shift schedules from Toast, Square, Clover, and 7shifts. Contains work hours, attendance, and labor cost data.",
    relationships: ["users (user_id)", "locations (location_id)"],
  },
  {
    name: "tasks",
    title: "Tasks & Training",
    description:
      "Task management and training assignments from 7shifts and other systems. Includes task status, assignments, and completion data.",
    relationships: ["users (assigned_to)", "locations (location_id)"],
  },
  // {
  //   name: "inventory",
  //   title: "Inventory",
  //   description:
  //     "Inventory levels and stock management from Clover and other systems. Tracks product quantities, reorder levels, and costs.",
  //   relationships: ["products (product_id)", "locations (location_id)"],
  // },
  {
    name: "payments",
    title: "Payments",
    description:
      "Individual payment transactions linked to orders from Toast, Square, and Clover POS systems. Contains payment methods, amounts, processing details, and transaction status.",
    relationships: ["orders (order_id)"],
  },
  {
    name: "product_ingredients",
    title: "Product Ingredients",
    description:
      "Links products to ingredient products with quantity requirements and costs. Self-referencing table for recipe management where products can be made from other products.",
    relationships: ["products (product_id)", "products (ingridiant_id)"],
  },
  {
    name: "locations",
    title: "Restaurant Locations",
    description:
      "Restaurant location information and integration settings. Central table that connects to all other entities.",
    relationships: [
      "orders (location_id)",
      "users (location_id)",
      "products (location_id)",
      "shifts (location_id)",
      "tasks (location_id)",
      "inventory (location_id)",
      "integrations (location_id)",
    ],
  },
  {
    name: "integrations",
    title: "System Integrations",
    description:
      "Integration configurations for POS systems, scheduling tools, and other restaurant management platforms.",
    relationships: ["locations (location_id)"],
  },
  {
    name: "inventory_logs",
    title: "Inventory Logs",
    description:
      "Tracks all inventory movements including inputs, outputs, and stock adjustments. Records every transaction that affects product stock levels.",
    relationships: [
      "products (product_id)",
      "orders (order_id)",
      "locations (location_id)",
      "users (performed_by)",
    ],
  },
  {
    name: "order_line_items",
    title: "Order Line Items",
    description:
      "Individual line items extracted from orders for better queryability and normalization. Contains detailed product information, quantities, and pricing for each item in an order.",
    relationships: [
      "orders (order_id)",
      "products (product_id)",
    ],
  },
];

export function getTableByName(tableName: string): TableMetadata | undefined {
  return AVAILABLE_TABLES.find((table) => table.name === tableName);
}

export function getTableMetadataForSelector(): Array<{
  title: string;
  description: string;
  relationships: string[];
}> {
  return AVAILABLE_TABLES.map((table) => ({
    title: table.title,
    description: table.description,
    relationships: table.relationships,
  }));
}
