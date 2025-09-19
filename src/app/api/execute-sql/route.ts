import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
});

export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL environment variable is not configured" },
        { status: 500 }
      );
    }

    // Debug: Log the DATABASE_URL (without exposing sensitive info)
    const dbUrl = process.env.DATABASE_URL;
    const maskedUrl = dbUrl.replace(/:[^:@]*@/, ':****@');
    console.log("🔗 Using DATABASE_URL:", maskedUrl);

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      );
    }

    // Basic SQL injection protection - only allow SELECT statements
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith("select")) {
      return NextResponse.json(
        {
          error: "Only SELECT queries are allowed",
        },
        { status: 400 }
      );
    }

    console.log("🔍 Executing SQL query:", query);

    // Execute the query directly using PostgreSQL
    const result = await executePostgreSQLQuery(query);

    if (result.error) {
      console.error("❌ SQL execution failed:", result.error);
      return NextResponse.json(
        {
          error: `SQL execution failed: ${result.error}`,
        },
        { status: 500 }
      );
    }

    console.log(
      "✅ SQL executed successfully, rows:",
      result.data?.length || 0
    );
    return NextResponse.json({
      data: result.data || [],
    });
  } catch (error) {
    console.error("Error executing SQL:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Execute a SQL query directly using PostgreSQL connection
 */
async function executePostgreSQLQuery(
  sqlQuery: string
): Promise<{ data?: any[]; error?: string }> {
  let client;
  
  try {
    console.log("🔧 Attempting to connect to PostgreSQL database...");
    client = await pool.connect();
    console.log("✅ Successfully connected to database");

    console.log("🔧 Executing query with direct PostgreSQL connection");

    // Execute the raw SQL query
    const result = await client.query(sqlQuery);

    // Return the rows from the query result
    return { data: result.rows };
  } catch (error) {
    console.error("Error in PostgreSQL query execution:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        return {
          error: `Database connection failed: Cannot resolve database host. Please check your DATABASE_URL. Error: ${error.message}`
        };
      } else if (error.message.includes('ECONNREFUSED')) {
        return {
          error: `Database connection refused: Database server is not accepting connections. Error: ${error.message}`
        };
      } else if (error.message.includes('authentication failed')) {
        return {
          error: `Database authentication failed: Invalid credentials. Error: ${error.message}`
        };
      }
    }
    
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unknown error in query execution",
    };
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
}
