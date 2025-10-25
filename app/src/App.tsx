import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Issues = lazy(() => import('@/pages/IssuesWithQuery'));
const IssueForm = lazy(() => import('@/pages/IssueForm'));
const ImportCSV = lazy(() => import('@/pages/ImportCSV'));

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    },
  },
});

// Loading component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="issues"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Issues />
                </Suspense>
              }
            />
            <Route
              path="issues/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <IssueForm />
                </Suspense>
              }
            />
            <Route
              path="issues/:id/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <IssueForm />
                </Suspense>
              }
            />
            <Route
              path="issues/import"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ImportCSV />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#16a34a',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />

        {/* React Query Devtools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
