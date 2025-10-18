'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { UserRole, User as UserType } from '@/types';

// Types for user management
interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole | 'all';
  search?: string;
  status?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
  profileData: any;
}

interface UpdateUserData {
  email?: string;
  isActive?: boolean;
  profileData?: any;
}

interface AssignmentData {
  educatorIds: string[];
  centerIds?: string[];
  schoolIds?: string[];
}

// Query hooks
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => apiClient.getAllUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useEducators(filters: Omit<UserFilters, 'role'> = {}) {
  return useQuery({
    queryKey: queryKeys.users.byRole('educators', filters),
    queryFn: async () => {
      const response = await apiClient.getAllUsers({
        ...filters,
        limit: filters.limit || 100,
      });
      
      // Filter for educator roles on the client side
      const educatorUsers = response.data?.filter((user: any) => 
        user.role === UserRole.SPECIAL_EDUCATOR || user.role === UserRole.SUPER_SPECIAL_EDUCATOR
      ) || [];
      
      return {
        ...response,
        data: educatorUsers,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCenters(filters: Omit<UserFilters, 'role'> = {}) {
  return useQuery({
    queryKey: queryKeys.centers.list(filters),
    queryFn: () => apiClient.getAllCenters(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSchools(filters: Omit<UserFilters, 'role'> & { centerId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.schools.list(filters),
    queryFn: () => apiClient.getAllSchools(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Mutation hooks
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userData: CreateUserData) => apiClient.createUser(userData),
    onSuccess: (newUser, variables) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      
      // If it's an educator, also invalidate educators query
      if (variables.role === UserRole.SPECIAL_EDUCATOR || variables.role === UserRole.SUPER_SPECIAL_EDUCATOR) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.byRole('educators', {}) });
      }
      
      // Invalidate user stats
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() });
      
      toast({
        title: "Success",
        description: "User created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to create user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserData }) => 
      apiClient.updateUser(userId, userData),
    onMutate: async ({ userId, userData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: queryKeys.users.all }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((user: any) => 
            user.id === userId ? { ...user, ...userData } : user
          ),
        };
      });

      return { previousUsers };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('Failed to update user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      // Optimistically remove the user from cache
      queryClient.setQueriesData({ queryKey: queryKeys.users.all }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.filter((user: any) => user.id !== userId),
          pagination: old.pagination ? {
            ...old.pagination,
            total: Math.max(0, old.pagination.total - 1),
          } : undefined,
        };
      });

      return { previousUsers };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('Failed to delete user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return isActive 
        ? apiClient.deactivateUser(userId)
        : apiClient.activateUser(userId);
    },
    onMutate: async ({ userId, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      // Optimistically update the user status
      queryClient.setQueriesData({ queryKey: queryKeys.users.all }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((user: any) => 
            user.id === userId ? { ...user, isActive: !isActive } : user
          ),
        };
      });

      return { previousUsers };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('Failed to toggle user status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (_, { isActive }) => {
      toast({
        title: "Success",
        description: `User ${isActive ? 'deactivated' : 'activated'} successfully.`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useAssignEducators() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (assignmentData: AssignmentData) => apiClient.assignEducators(assignmentData),
    onSuccess: (response, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byRole('educators', {}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.centers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      
      // Invalidate center-specific educator assignments
      if (variables.centerIds) {
        variables.centerIds.forEach(centerId => {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.centers.educators(centerId, {}) 
          });
        });
      }
      
      const message = response?.message || 
        `Successfully assigned ${variables.educatorIds.length} educator(s) to ${
          variables.centerIds?.length || variables.schoolIds?.length || 0
        } ${variables.centerIds ? 'center(s)' : 'school(s)'}.`;
      
      toast({
        title: "Success",
        description: message,
      });
    },
    onError: (error: any) => {
      console.error('Failed to assign educators:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to assign educators. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Utility hook for invalidating all user-related queries
export function useInvalidateUserQueries() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.centers.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
  };
}