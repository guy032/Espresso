import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import type { QueryParam } from '../types/database';

dotenv.config();

// Detect if running in Lambda environment
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Configure connection pool based on environment
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
  // Lambda uses minimal connections
  max: isLambda ? 2 : 20,
  idleTimeoutMillis: isLambda ? 0 : 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.info('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  // Don't exit the process, let it recover
});

// Helper function to test connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.info('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', (error as Error).message);
    return false;
  }
}

// Query helper with error handling
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: QueryParam[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.info('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
