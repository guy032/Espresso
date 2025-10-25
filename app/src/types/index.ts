// Re-export generated types from Orval
export * from '../api/generated/client';

// Additional app-specific types
export interface QueryFilters {
  search?: string;
  status?: 'open' | 'in_progress' | 'resolved';
  severity?: 'minor' | 'major' | 'critical';
  site?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  statusCounts: {
    open: number;
    in_progress: number;
    resolved: number;
  };
  severityCounts: {
    minor: number;
    major: number;
    critical: number;
  };
  totalIssues: number;
}

export type ViewMode = 'grid' | 'table';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors?: string[];
}
