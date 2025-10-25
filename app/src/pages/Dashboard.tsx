import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import type { DashboardStats } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<DashboardStats>(`${API_BASE_URL}/dashboard`);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const statusCards = [
    {
      label: 'Open Issues',
      value: stats.statusCounts.open,
      icon: AlertCircle,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50 dark:bg-danger-900/20',
      trend: stats.statusCounts.open > 0 ? 'up' : 'neutral',
    },
    {
      label: 'In Progress',
      value: stats.statusCounts.in_progress,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
      trend: 'neutral',
    },
    {
      label: 'Resolved',
      value: stats.statusCounts.resolved,
      icon: CheckCircle2,
      color: 'text-success-600',
      bgColor: 'bg-success-50 dark:bg-success-900/20',
      trend: stats.statusCounts.resolved > 0 ? 'up' : 'neutral',
    },
  ];

  const severityCards = [
    {
      label: 'Critical',
      value: stats.severityCounts.critical,
      icon: XCircle,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    },
    {
      label: 'Major',
      value: stats.severityCounts.major,
      icon: AlertTriangle,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    },
    {
      label: 'Minor',
      value: stats.severityCounts.minor,
      icon: Activity,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of all clinical trial issues
          </p>
        </div>
        <Link to="/issues" className="btn btn-primary">
          View All Issues
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Total Issues Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Issues</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {stats.totalIssues}
            </p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Issues by Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusCards.map((card) => (
            <div key={card.label} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {card.value}
                  </p>
                  {card.trend && (
                    <div className="flex items-center gap-1 mt-2">
                      {card.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-success-600" />
                      ) : card.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-danger-600" />
                      ) : null}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {card.value > 0 ? 'Active' : 'None'}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    card.bgColor
                  )}
                >
                  <card.icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Severity Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Issues by Severity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {severityCards.map((card) => (
            <div key={card.label} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {card.value}
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          card.label === 'Critical'
                            ? 'bg-danger-600'
                            : card.label === 'Major'
                              ? 'bg-warning-600'
                              : 'bg-primary-600'
                        )}
                        style={{
                          width: `${stats.totalIssues > 0 ? (card.value / stats.totalIssues) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    card.bgColor
                  )}
                >
                  <card.icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/issues/new" className="btn btn-primary text-center">
            Create New Issue
          </Link>
          <Link to="/issues?status=open" className="btn btn-secondary text-center">
            View Open Issues
          </Link>
          <Link to="/issues?severity=critical" className="btn btn-secondary text-center">
            Critical Issues
          </Link>
          <Link to="/issues/import" className="btn btn-secondary text-center">
            Import CSV
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
