import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, AlertCircle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Validation schema
const issueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Description is required'),
  site: z.string().min(1, 'Site is required').max(100, 'Site must be less than 100 characters'),
  severity: z.enum(['minor', 'major', 'critical']).refine((val) => val !== undefined, {
    message: 'Severity is required',
  }),
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
});

type IssueFormData = z.infer<typeof issueSchema>;

const IssueForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchingIssue, setFetchingIssue] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: '',
      description: '',
      site: '',
      severity: 'minor',
      status: 'open',
    },
  });

  const currentStatus = watch('status');

  // Fetch issue data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchIssue(id);
    }
  }, [id, isEditMode]);

  const fetchIssue = async (issueId: string) => {
    try {
      setFetchingIssue(true);
      const response = await axios.get(`${API_BASE_URL}/issues/${issueId}`);
      const issue = response.data;
      reset({
        title: issue.title,
        description: issue.description,
        site: issue.site,
        severity: issue.severity,
        status: issue.status,
      });
    } catch (error) {
      console.error('Failed to fetch issue:', error);
      toast.error('Failed to load issue');
      navigate('/issues');
    } finally {
      setFetchingIssue(false);
    }
  };

  const onSubmit = async (data: IssueFormData) => {
    try {
      setLoading(true);

      if (isEditMode && id) {
        // Update existing issue
        await axios.put(`${API_BASE_URL}/issues/${id}`, data);
        toast.success('Issue updated successfully');
      } else {
        // Create new issue
        const { status, ...createData } = data; // Remove status for new issues (defaults to 'open')
        await axios.post(`${API_BASE_URL}/issues`, {
          ...createData,
          status: status || 'open',
        });
        toast.success('Issue created successfully');
      }

      navigate('/issues');
    } catch (error: any) {
      console.error('Failed to save issue:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save issue';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingIssue) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/issues"
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Issues
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditMode ? 'Edit Issue' : 'Create New Issue'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {isEditMode
            ? 'Update the issue details below'
            : 'Fill in the details to create a new issue'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6">
          {/* Title */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Title <span className="text-danger-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={cn('input', errors.title && 'border-danger-500 focus:ring-danger-500')}
              placeholder="Brief description of the issue"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-danger-600 dark:text-danger-400 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={6}
              className={cn(
                'input resize-none',
                errors.description && 'border-danger-500 focus:ring-danger-500'
              )}
              placeholder="Provide detailed information about the issue..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger-600 dark:text-danger-400 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Site and Severity Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Site */}
            <div>
              <label
                htmlFor="site"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Site <span className="text-danger-500">*</span>
              </label>
              <input
                id="site"
                type="text"
                {...register('site')}
                className={cn('input', errors.site && 'border-danger-500 focus:ring-danger-500')}
                placeholder="e.g., Site-101"
              />
              {errors.site && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.site.message}
                </p>
              )}
            </div>

            {/* Severity */}
            <div>
              <label
                htmlFor="severity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Severity <span className="text-danger-500">*</span>
              </label>
              <select
                id="severity"
                {...register('severity')}
                className={cn(
                  'select',
                  errors.severity && 'border-danger-500 focus:ring-danger-500'
                )}
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
              {errors.severity && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.severity.message}
                </p>
              )}
            </div>
          </div>

          {/* Status (only in edit mode) */}
          {isEditMode && (
            <div className="mb-4">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Status
              </label>
              <select id="status" {...register('status')} className="select">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              {currentStatus === 'resolved' && (
                <div className="mt-2 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-success-800 dark:text-success-200">
                    <p className="font-medium">Issue Resolved</p>
                    <p className="mt-1">
                      This issue has been marked as resolved and will be closed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Severity Information */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Severity Guidelines
            </h4>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="font-medium text-primary-600 mr-2">Minor:</span>
                <span>Low impact issues that don't affect trial integrity</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-warning-600 mr-2">Major:</span>
                <span>Significant issues requiring prompt attention</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-danger-600 mr-2">Critical:</span>
                <span>Urgent issues that may impact patient safety or trial validity</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between">
          <Link to="/issues" className="btn btn-ghost">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Link>

          <button type="submit" disabled={isSubmitting || loading} className="btn btn-primary">
            {isSubmitting || loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Issue' : 'Create Issue'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueForm;
