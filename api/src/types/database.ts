// Database-specific type definitions

import type { QueryResultRow } from 'pg';
import type { Issue } from './index';

export interface IssueRow extends QueryResultRow {
  id: number;
  title: string;
  description: string;
  site: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  created_at: Date;
  updated_at: Date;
}

export interface DashboardRow extends QueryResultRow {
  count: string;
  status?: string;
  severity?: string;
}

export interface CountRow extends QueryResultRow {
  count: string;
}

export type QueryParam = string | number | boolean | Date | null | undefined;

export type IssueQueryResult = Issue & QueryResultRow;

export interface QueryConfig {
  text: string;
  values?: QueryParam[];
}

export interface BulkInsertConfig {
  tableName: string;
  columns: string[];
  values: QueryParam[][];
}

export interface FilterCondition {
  column: string;
  operator: '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'ILIKE' | 'IN';
  value: QueryParam | QueryParam[];
}

export interface OrderByConfig {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginationConfig {
  limit: number;
  offset: number;
}

export interface QueryBuilderConfig {
  table: string;
  columns?: string[];
  where?: FilterCondition[];
  orderBy?: OrderByConfig[];
  pagination?: PaginationConfig;
}
