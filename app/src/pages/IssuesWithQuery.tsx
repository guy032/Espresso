import React, { useState, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  Loader2,
  Upload,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn, formatDateShort, getSeverityColor, getStatusColor, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';

// Import generated functions and hooks from Orval
import {
  listIssues,
  useDeleteIssue,
  useResolveIssue,
  getListIssuesInfiniteQueryKey,
} from '@/api/generated/issues/issues';
import type { Issue, ListIssuesParams } from '@/api/generated/models';

const PAGE_SIZE = 10;

interface Filters {
  search: string;
  status: string;
  severity: string;
  site: string;
  sort: string;
  order: 'asc' | 'desc';
}

const IssuesWithQuery: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(
    (localStorage.getItem('issuesViewMode') as 'grid' | 'table') || 'table'
  );

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    severity: '',
    site: '',
    sort: 'createdAt',
    order: 'desc',
  });

  const [searchInput, setSearchInput] = useState('');

  // Build base params for the API query (without page)
  const baseParams = {
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status as any }),
    ...(filters.severity && { severity: filters.severity as any }),
    ...(filters.site && { site: filters.site }),
    sort: filters.sort as any,
    order: filters.order as any,
    limit: PAGE_SIZE,
  };

  // Use custom infinite query with the Orval-generated fetch function
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: getListIssuesInfiniteQueryKey(baseParams),
      queryFn: async ({ pageParam = 1 }) => {
        const params: ListIssuesParams = {
          ...baseParams,
          page: pageParam as number,
        };
        return listIssues(params);
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        // Check if we have a full page of results
        if (lastPage && lastPage.length === PAGE_SIZE) {
          return allPages.length + 1;
        }
        return undefined;
      },
      refetchOnWindowFocus: false,
      staleTime: 30000,
    });

  // Infinite scroll trigger
  const { ref: infiniteRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Delete mutation using generated hook
  const deleteMutation = useDeleteIssue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['infinite', '/issues'] });
        queryClient.invalidateQueries({ queryKey: ['/issues'] });
        toast.success('Issue deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete issue');
      },
    },
  });

  // Resolve mutation using generated hook
  const resolveMutation = useResolveIssue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['infinite', '/issues'] });
        queryClient.invalidateQueries({ queryKey: ['/issues'] });
        toast.success('Issue resolved successfully');
      },
      onError: () => {
        toast.error('Failed to resolve issue');
      },
    },
  });

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev) => ({ ...prev, search: value }));
      }, 300),
    []
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      severity: '',
      site: '',
      sort: 'createdAt',
      order: 'desc',
    });
    setSearchInput('');
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this issue?')) {
      deleteMutation.mutate({ id });
    }
  };

  // Handle resolve
  const handleResolve = (id: number) => {
    resolveMutation.mutate({ id });
  };

  // Get all issues from pages
  const allIssues = data?.pages.flatMap((page) => page) || [];

  // Get unique sites for filter
  const uniqueSites = useMemo(() => {
    const sites = [...new Set(allIssues.map((issue) => issue.site))];
    return sites.sort();
  }, [allIssues]);

  const hasActiveFilters = filters.search || filters.status || filters.severity || filters.site;

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

  const SortIcon = ({ field }: { field: string }) => {
    if (filters.sort !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return filters.order === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary-600" />
    );
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
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            className="select"
            value={filters.status}
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
            value={filters.severity}
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
            value={filters.site}
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
                onClick={() => setViewMode('table')}
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
                onClick={() => setViewMode('grid')}
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
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : isError ? (
        <div className="card p-12">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-danger-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to load issues
            </h3>
            <button onClick={() => refetch()} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      ) : allIssues.length === 0 ? (
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
        /* Table View with Infinite Scroll */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="table">
                <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10 shadow-sm">
                  <tr>
                    <th
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        <SortIcon field="title" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('site')}
                    >
                      <div className="flex items-center gap-2">
                        Site
                        <SortIcon field="site" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('severity')}
                    >
                      <div className="flex items-center gap-2">
                        Severity
                        <SortIcon field="severity" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Created
                        <SortIcon field="createdAt" />
                      </div>
                    </th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.pages.map((page, pageIndex) => (
                    <Fragment key={pageIndex}>
                      {page.map((issue: Issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                              {formatDateShort(issue.createdAt || '')}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-end gap-1">
                              {issue.status !== 'resolved' && (
                                <button
                                  onClick={() => issue.id && handleResolve(issue.id)}
                                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Resolve issue"
                                  disabled={resolveMutation.isPending}
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
                                onClick={() => issue.id && handleDelete(issue.id)}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Delete issue"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-danger-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>

              {/* Infinite scroll trigger */}
              <div ref={infiniteRef} className="p-4 text-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more issues...
                  </div>
                ) : hasNextPage ? (
                  <button onClick={() => fetchNextPage()} className="btn btn-ghost">
                    Load More
                  </button>
                ) : (
                  allIssues.length > 0 && (
                    <p className="text-sm text-gray-500">Showing all {allIssues.length} issues</p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View with Infinite Scroll */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.pages.map((page, pageIndex) => (
              <Fragment key={pageIndex}>
                {page.map((issue: Issue) => (
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
                        <p>{formatDateShort(issue.createdAt || '')}</p>
                      </div>

                      <div className="flex gap-1">
                        {issue.status !== 'resolved' && (
                          <button
                            onClick={() => issue.id && handleResolve(issue.id)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Resolve issue"
                            disabled={resolveMutation.isPending}
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
                          onClick={() => issue.id && handleDelete(issue.id)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete issue"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </Fragment>
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={infiniteRef} className="p-4 text-center">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more issues...
              </div>
            ) : hasNextPage ? (
              <button onClick={() => fetchNextPage()} className="btn btn-ghost">
                Load More
              </button>
            ) : (
              allIssues.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">Showing all {allIssues.length} issues</p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuesWithQuery;
