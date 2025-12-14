'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimized caching settings to prevent 304 issues
            staleTime: 5 * 60 * 1000, // 5 minutes - longer stale time reduces unnecessary requests
            gcTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer

            // Enable request deduplication to prevent duplicate calls
            refetchOnWindowFocus: false, // Prevent refetch on window focus to reduce 304s
            refetchOnMount: false, // Only refetch if data is stale
            refetchOnReconnect: 'always', // Refetch on network reconnect

            // Background refetching settings
            refetchInterval: false, // Disable automatic background refetching
            refetchIntervalInBackground: false,

            // Retry configuration
            retry: (failureCount, error: any) => {
              // Don't retry on 401, 403, 404, 422
              if (error?.response?.status === 401 ||
                error?.response?.status === 403 ||
                error?.response?.status === 404 ||
                error?.response?.status === 422) {
                return false;
              }
              // Retry network errors and 5xx errors up to 2 times
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Network mode settings
            networkMode: 'online',
          },
          mutations: {
            retry: false,
            // Add network mode for mutations
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </NotificationProvider>
    </QueryClientProvider>
  );
}
