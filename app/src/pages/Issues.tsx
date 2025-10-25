import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';
import { cn, formatDateShort, getSeverityColor, getStatusColor, debounce } from '@/lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface Issue {
  id: number;
  title: string;
  description: string;
  site: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

const Issues: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(
    (localStorage.getItem('issuesViewMode') as 'grid' | 'table') || 'table'
  );

  // Filters from URL params
  const filters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    severity: searchParams.get('severity') || '',
    site: searchParams.get('site') || '',
    sort: searchParams.get('sort') || 'createdAt',
    order: searchParams.get('order') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  // Local filter state for controlled inputs
  const [localFilters, setLocalFilters] = useState(filters);

  // Unique sites for filter dropdown
  const uniqueSites = useMemo(() => {
    const sites = [...new Set(issues.map((issue) => issue.site))];
    return sites.sort();
  }, [issues]);

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get<Issue[]>(`${API_BASE_URL}/issues?${params}`);
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.status,
    filters.severity,
    filters.site,
    filters.sort,
    filters.order,
    filters.page,
    filters.limit,
  ]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
          newParams.set('search', value);
        } else {
          newParams.delete('search');
        }
        newParams.set('page', '1'); // Reset to first page on search
        setSearchParams(newParams);
      }, 300),
    [searchParams, setSearchParams]
  );

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page on filter change
    setSearchParams(newParams);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/issues/${id}`);
      toast.success('Issue deleted successfully');
      fetchIssues();
    } catch (error) {
      console.error('Failed to delete issue:', error);
      toast.error('Failed to delete issue');
    }
  };

  // Handle resolve
  const handleResolve = async (id: number) => {
    try {
      await axios.patch(`${API_BASE_URL}/issues/${id}/resolve`);
      toast.success('Issue resolved successfully');
      fetchIssues();
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      toast.error('Failed to resolve issue');
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('issuesViewMode', mode);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setLocalFilters({
      search: '',
      status: '',
      severity: '',
      site: '',
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 20,
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.severity || filters.site;

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters.search, filters.status, filters.severity, filters.site]);

  const StatusIcon = ({ status }: { status: Issue['status'] }) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Issues</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage clinical trial issues</p>
        </div>
        <div className="flex gap-2">
          <Link to="/issues/import" className="btn btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Link>
          <Link to="/issues/new" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Issue
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                className="input pl-10"
                value={localFilters.search}
                onChange={(e) => {
                  setLocalFilters({ ...localFilters, search: e.target.value });
                  debouncedSearch(e.target.value);
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            className="select"
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Severity Filter */}
          <select
            className="select"
            value={localFilters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>

          {/* Site Filter */}
          <select
            className="select"
            value={localFilters.site}
            onChange={(e) => handleFilterChange('site', e.target.value)}
          >
            <option value="">All Sites</option>
            {uniqueSites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>

          {/* Actions */}
          <div className="flex gap-2">
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="btn btn-ghost flex-1">
                Clear
              </button>
            )}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleViewModeChange('table')}
                className={cn(
                  'p-2 rounded-lg',
                  viewMode === 'table'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={cn(
                  'p-2 rounded-lg',
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.search && <span className="badge badge-info">Search: {filters.search}</span>}
            {filters.status && (
              <span className="badge badge-info">Status: {filters.status.replace('_', ' ')}</span>
            )}
            {filters.severity && (
              <span className="badge badge-info">Severity: {filters.severity}</span>
            )}
            {filters.site && <span className="badge badge-info">Site: {filters.site}</span>}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : issues.length === 0 ? (
        <div className="card p-12">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No issues found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Get started by creating your first issue'}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="btn btn-primary">
                Clear Filters
              </button>
            ) : (
              <Link to="/issues/new" className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Issue
              </Link>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Site</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <div className="max-w-xs">
                        <Link
                          to={`/issues/${issue.id}/edit`}
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {issue.title}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                          {issue.description}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{issue.site}</span>
                    </td>
                    <td>
                      <span className={cn('badge', getSeverityColor(issue.severity))}>
                        {issue.severity}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', getStatusColor(issue.status))}>
                        <StatusIcon status={issue.status} />
                        <span className="ml-1">{issue.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateShort(issue.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {issue.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(issue.id)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Resolve issue"
                          >
                            <CheckCircle className="h-4 w-4 text-success-600" />
                          </button>
                        )}
                        <Link
                          to={`/issues/${issue.id}/edit`}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit issue"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <button
                          onClick={() => handleDelete(issue.id)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete issue"
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <div key={issue.id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <span className={cn('badge', getSeverityColor(issue.severity))}>
                  {issue.severity}
                </span>
                <span className={cn('badge', getStatusColor(issue.status))}>
                  <StatusIcon status={issue.status} />
                  <span className="ml-1">{issue.status.replace('_', ' ')}</span>
                </span>
              </div>

              <Link to={`/issues/${issue.id}/edit`} className="block mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400">
                  {issue.title}
                </h3>
              </Link>

              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                {issue.description}
              </p>

              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>{issue.site}</p>
                  <p>{formatDateShort(issue.createdAt)}</p>
                </div>

                <div className="flex gap-1">
                  {issue.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(issue.id)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Resolve issue"
                    >
                      <CheckCircle className="h-4 w-4 text-success-600" />
                    </button>
                  )}
                  <Link
                    to={`/issues/${issue.id}/edit`}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Edit issue"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </Link>
                  <button
                    onClick={() => handleDelete(issue.id)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Delete issue"
                  >
                    <Trash2 className="h-4 w-4 text-danger-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {issues.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {issues.length} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('page', String(filters.page - 1))}
              disabled={filters.page === 1}
              className="btn btn-ghost"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => handleFilterChange('page', String(filters.page + 1))}
              disabled={issues.length < filters.limit}
              className="btn btn-ghost"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;
