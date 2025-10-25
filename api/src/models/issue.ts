import { query, withTransaction } from '../db/connection';
import type { Issue, DashboardCounts, QueryFilters } from '../types/index';
import type { QueryParam } from '../types/database';
import type { PoolClient } from 'pg';

export class IssueModel {
  // Get all issues with optional filters
  static async findAll(filters: QueryFilters = {}): Promise<Issue[]> {
    let sql = `
      SELECT 
        id, title, description, site, severity, status,
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM issues
      WHERE 1=1
    `;
    const params: QueryParam[] = [];
    let paramCount = 0;

    // Add search filter (searches in title)
    if (filters.search) {
      paramCount++;
      sql += ` AND LOWER(title) LIKE LOWER($${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    // Add status filter
    if (filters.status) {
      paramCount++;
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    // Add severity filter
    if (filters.severity) {
      paramCount++;
      sql += ` AND severity = $${paramCount}`;
      params.push(filters.severity);
    }

    // Add site filter
    if (filters.site) {
      paramCount++;
      sql += ` AND site = $${paramCount}`;
      params.push(filters.site);
    }

    // Add sorting (convert camelCase to snake_case for DB columns)
    const sortFieldMap: Record<string, string> = {
      id: 'id',
      title: 'title',
      site: 'site',
      severity: 'severity',
      status: 'status',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      created_at: 'created_at',
      updated_at: 'updated_at',
    };

    const requestedSort = filters.sort || 'createdAt';
    const dbSortField = sortFieldMap[requestedSort] || 'created_at';
    const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${dbSortField} ${sortOrder}`;

    // Add pagination
    if (filters.limit) {
      paramCount++;
      sql += ` LIMIT $${paramCount}`;
      params.push(parseInt(filters.limit as string) || 50);
    }

    if (filters.page && filters.limit) {
      paramCount++;
      const offset = (parseInt(filters.page as string) - 1) * parseInt(filters.limit as string);
      sql += ` OFFSET $${paramCount}`;
      params.push(offset);
    }

    const result = await query<Issue>(sql, params);
    return result.rows;
  }

  // Get issue by ID
  static async findById(id: number): Promise<Issue | null> {
    const sql = `
      SELECT 
        id, title, description, site, severity, status,
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM issues 
      WHERE id = $1
    `;
    const result = await query<Issue>(sql, [id]);
    return result.rows[0] || null;
  }

  // Create new issue
  static async create(data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Issue> {
    const { title, description, site, severity, status = 'open' } = data;

    const sql = `
      INSERT INTO issues (title, description, site, severity, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id, title, description, site, severity, status,
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;

    const result = await query<Issue>(sql, [title, description, site, severity, status]);
    return result.rows[0]!;
  }

  // Update issue
  static async update(id: number, data: Partial<Omit<Issue, 'id'>>): Promise<Issue | null> {
    const { title, description, site, severity, status } = data;

    // Build dynamic update query
    const updates: string[] = [];
    const values: QueryParam[] = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (site !== undefined) {
      paramCount++;
      updates.push(`site = $${paramCount}`);
      values.push(site);
    }

    if (severity !== undefined) {
      paramCount++;
      updates.push(`severity = $${paramCount}`);
      values.push(severity);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }

    if (updates.length === 0) {
      // No updates provided
      return this.findById(id);
    }

    paramCount++;
    values.push(id);

    const sql = `
      UPDATE issues 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, title, description, site, severity, status,
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;

    const result = await query<Issue>(sql, values);
    return result.rows[0] || null;
  }

  // Delete issue
  static async delete(id: number): Promise<boolean> {
    const sql = `
      DELETE FROM issues 
      WHERE id = $1
      RETURNING id
    `;
    const result = await query(sql, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Quick resolve - set status to resolved
  static async resolve(id: number): Promise<Issue | null> {
    const sql = `
      UPDATE issues 
      SET status = 'resolved'
      WHERE id = $1
      RETURNING 
        id, title, description, site, severity, status,
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;
    const result = await query<Issue>(sql, [id]);
    return result.rows[0] || null;
  }

  // Get counts for dashboard
  static async getCounts(): Promise<DashboardCounts> {
    const statusCountsSql = `
      SELECT status, COUNT(*) as count
      FROM issues
      GROUP BY status
    `;

    const severityCountsSql = `
      SELECT severity, COUNT(*) as count
      FROM issues
      GROUP BY severity
    `;

    const totalCountSql = `
      SELECT COUNT(*) as total FROM issues
    `;

    const [statusResult, severityResult, totalResult] = await Promise.all([
      query<{ status: Issue['status']; count: string }>(statusCountsSql),
      query<{ severity: Issue['severity']; count: string }>(severityCountsSql),
      query<{ total: string }>(totalCountSql),
    ]);

    // Format the results
    const statusCounts: DashboardCounts['statusCounts'] = {
      open: 0,
      in_progress: 0,
      resolved: 0,
    };

    const severityCounts: DashboardCounts['severityCounts'] = {
      minor: 0,
      major: 0,
      critical: 0,
    };

    statusResult.rows.forEach((row) => {
      statusCounts[row.status] = parseInt(row.count);
    });

    severityResult.rows.forEach((row) => {
      severityCounts[row.severity] = parseInt(row.count);
    });

    return {
      statusCounts,
      severityCounts,
      totalIssues: parseInt(totalResult.rows[0]?.total ?? '0'),
    };
  }

  // Bulk insert for CSV import
  static async bulkCreate(issues: Array<Omit<Issue, 'id' | 'updatedAt'>>): Promise<Issue[]> {
    return withTransaction(async (client: PoolClient) => {
      const inserted: Issue[] = [];

      for (const issue of issues) {
        const { title, description, site, severity, status = 'open', createdAt } = issue;

        let sql: string;
        let params: QueryParam[];

        if (createdAt) {
          sql = `
            INSERT INTO issues (title, description, site, severity, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING 
              id, title, description, site, severity, status,
              created_at as "createdAt", 
              updated_at as "updatedAt"
          `;
          params = [title, description, site, severity, status, createdAt];
        } else {
          sql = `
            INSERT INTO issues (title, description, site, severity, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING 
              id, title, description, site, severity, status,
              created_at as "createdAt", 
              updated_at as "updatedAt"
          `;
          params = [title, description, site, severity, status];
        }

        const result = await client.query<Issue>(sql, params);
        if (result.rows[0]) {
          inserted.push(result.rows[0]);
        }
      }

      return inserted;
    });
  }

  // Bulk upsert issues (update if exists based on title+site, insert if new)
  static async bulkUpsert(issues: Array<Omit<Issue, 'id' | 'updatedAt'>>): Promise<{
    inserted: Issue[];
    updated: Issue[];
    total: number;
  }> {
    return withTransaction(async (client: PoolClient) => {
      const inserted: Issue[] = [];
      const updated: Issue[] = [];

      for (const issue of issues) {
        const { title, description, site, severity, status = 'open', createdAt } = issue;

        // Use PostgreSQL's INSERT ... ON CONFLICT for upsert
        const sql = `
          INSERT INTO issues (title, description, site, severity, status${createdAt ? ', created_at' : ''})
          VALUES ($1, $2, $3, $4, $5${createdAt ? ', $6' : ''})
          ON CONFLICT (title, site) 
          DO UPDATE SET 
            description = EXCLUDED.description,
            severity = EXCLUDED.severity,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
          RETURNING 
            id, title, description, site, severity, status,
            created_at as "createdAt", updated_at as "updatedAt",
            (xmax = 0) as "wasInserted"
        `;

        const params: QueryParam[] = createdAt
          ? [title, description, site, severity, status, createdAt]
          : [title, description, site, severity, status];

        const result = await client.query<Issue & { wasInserted: boolean }>(sql, params);

        if (result.rows[0]) {
          const { wasInserted, ...issueData } = result.rows[0];
          if (wasInserted) {
            inserted.push(issueData);
          } else {
            updated.push(issueData);
          }
        }
      }

      return { inserted, updated, total: inserted.length + updated.length };
    });
  }

  // Delete all issues (for testing)
  static async deleteAll(): Promise<number> {
    const sql = 'DELETE FROM issues';
    const result = await query(sql);
    return result.rowCount ?? 0;
  }
}
