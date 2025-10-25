// Type definitions for the application

export interface Issue {
  id?: number;
  title: string;
  description: string;
  site: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface DashboardCounts {
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

export interface QueryFilters {
  search?: string;
  status?: Issue['status'];
  severity?: Issue['severity'];
  site?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: string | number;
  limit?: string | number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiError {
  error: string;
  message: string;
  details?: ValidationError[];
  stack?: string;
  path?: string;
  method?: string;
}
