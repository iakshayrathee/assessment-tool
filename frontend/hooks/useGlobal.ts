'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';
import { toast } from '@/lib/toast';

// Global Search
export function useGlobalSearch(params?: {
  query?: string;
  type?: string;
  filters?: any;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.global.search(params),
    queryFn: () => apiClient.globalSearch(params),
    enabled: !!params?.query && params.query.length >= 2, // Only search with 2+ characters
    staleTime: 30 * 1000, // 30 seconds (search results change frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSearchSuggestions(query?: string) {
  return useQuery({
    queryKey: queryKeys.global.searchSuggestions(query),
    queryFn: () => apiClient.getSearchSuggestions(query!),
    enabled: !!query && query.length >= 1,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentSearches() {
  const queryClient = useQueryClient();

  const recentSearchesQuery = useQuery({
    queryKey: queryKeys.global.recentSearches(),
    queryFn: () => apiClient.getRecentSearches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const clearRecentSearchesMutation = useMutation({
    mutationFn: () => apiClient.clearRecentSearches(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.global.recentSearches() });
      toast.success('Recent searches cleared!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to clear recent searches');
    },
  });

  return {
    recentSearches: recentSearchesQuery.data || [],
    isLoading: recentSearchesQuery.isLoading,
    isClearing: clearRecentSearchesMutation.isPending,
    clearRecentSearches: clearRecentSearchesMutation.mutate,
    error: recentSearchesQuery.error,
    refetch: recentSearchesQuery.refetch,
  };
}

// File Management
export function useFileUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadData: {
      file: File;
      type?: string;
      category?: string;
      metadata?: any;
    }) => apiClient.uploadFile(uploadData.file, uploadData.category),
    onSuccess: (uploadedFile) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.lists() });
      toast.success('File uploaded successfully!');
      return uploadedFile;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    },
  });
}

export function useFiles(params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  search?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: queryKeys.files.lists(),
    queryFn: () => apiClient.getFiles(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => apiClient.deleteFile(fileId),
    onSuccess: (_, fileId) => {
      invalidationPatterns.file(fileId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('File deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete file');
    },
  });

  const updateFileMetadataMutation = useMutation({
    mutationFn: ({ fileId, metadata }: { fileId: string; metadata: any }) =>
      apiClient.updateFileMetadata(fileId, metadata),
    onSuccess: (_, { fileId }) => {
      invalidationPatterns.file(fileId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('File metadata updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update file metadata');
    },
  });

  return {
    files: filesQuery.data?.data || [],
    pagination: filesQuery.data?.pagination,
    isLoading: filesQuery.isLoading,
    isDeleting: deleteFileMutation.isPending,
    isUpdating: updateFileMetadataMutation.isPending,
    deleteFile: deleteFileMutation.mutate,
    updateFileMetadata: updateFileMetadataMutation.mutate,
    error: filesQuery.error,
    refetch: filesQuery.refetch,
  };
}

export function useFileDetails(fileId?: string) {
  return useQuery({
    queryKey: queryKeys.files.detail(fileId!),
    queryFn: () => apiClient.getFileDetails(fileId!),
    enabled: !!fileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useFileDownload() {
  return useMutation({
    mutationFn: (fileId: string) => apiClient.downloadFile(fileId),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to download file');
    },
  });
}

// System Configuration
export function useSystemConfig() {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: queryKeys.global.systemConfig(),
    queryFn: () => apiClient.getSystemConfig(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const updateConfigMutation = useMutation({
    mutationFn: (configData: any) => apiClient.updateSystemConfig(configData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.global.systemConfig() });
      toast.success('System configuration updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update system configuration');
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    isUpdating: updateConfigMutation.isPending,
    updateConfig: updateConfigMutation.mutate,
    error: configQuery.error,
    refetch: configQuery.refetch,
  };
}

// Application Settings
export function useAppSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: queryKeys.global.appSettings(),
    queryFn: () => apiClient.getAppSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiClient.updateAppSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.global.appSettings() });
      toast.success('Application settings updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update application settings');
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isUpdating: updateSettingsMutation.isPending,
    updateSettings: updateSettingsMutation.mutate,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
  };
}

// Health Check
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.global.healthCheck(),
    queryFn: () => apiClient.healthCheck(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
  });
}

// Statistics
export function useGlobalStatistics(params?: {
  period?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: queryKeys.global.statistics(params),
    queryFn: () => apiClient.getGlobalStatistics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Activity Logs
export function useActivityLogs(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.global.activityLogs(params),
    queryFn: () => apiClient.getActivityLogs(params),
    staleTime: 1 * 60 * 1000, // 1 minute (activity logs need fresh data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Cache Management
export function useCacheManagement() {
  const queryClient = useQueryClient();

  const clearCacheMutation = useMutation({
    mutationFn: (cacheKeys?: string[]) => {
      if (cacheKeys && cacheKeys.length > 0) {
        // Clear specific cache keys
        cacheKeys.forEach(key => {
          queryClient.removeQueries({ queryKey: [key] });
        });
        return Promise.resolve();
      } else {
        // Clear all cache
        queryClient.clear();
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      toast.success('Cache cleared successfully!');
    },
    onError: () => {
      toast.error('Failed to clear cache');
    },
  });

  const invalidateCacheMutation = useMutation({
    mutationFn: (cacheKeys?: string[]) => {
      if (cacheKeys && cacheKeys.length > 0) {
        // Invalidate specific cache keys
        cacheKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
        return Promise.resolve();
      } else {
        // Invalidate all cache
        queryClient.invalidateQueries();
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      toast.success('Cache invalidated successfully!');
    },
    onError: () => {
      toast.error('Failed to invalidate cache');
    },
  });

  return {
    isClearing: clearCacheMutation.isPending,
    isInvalidating: invalidateCacheMutation.isPending,
    clearCache: clearCacheMutation.mutate,
    invalidateCache: invalidateCacheMutation.mutate,
  };
}

// Export/Import
export function useDataExport() {
  return useMutation({
    mutationFn: (exportParams: {
      type: string;
      format: string;
      filters?: any;
      dateRange?: { from: string; to: string };
    }) => apiClient.exportData(exportParams),
    onSuccess: () => {
      toast.success('Data export initiated! You will receive a download link shortly.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export data');
    },
  });
}

export function useDataImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importData: {
      file: File;
      type: string;
      options?: any;
    }) => apiClient.importData(importData),
    onSuccess: () => {
      // Invalidate all relevant queries after import
      queryClient.invalidateQueries();
      toast.success('Data imported successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to import data');
    },
  });
}