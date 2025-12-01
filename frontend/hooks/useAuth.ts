import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { LoginRequest, User } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Get current user from Zustand store
  const getCurrentUser = (): User | null => {
    return useAuthStore.getState().user;
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => apiClient.login(credentials),
    onSuccess: (data) => {
      // Clear all existing queries and set new user data
      queryClient.clear();
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      queryClient.setQueryData(queryKeys.auth.profile(), data.user);
      if (data.token) {
        queryClient.setQueryData(queryKeys.auth.token(), data.token);
      }
      toast.success('Login successful!');
      
      // Redirect based on user role
      const redirectPath = getRoleBasedRedirect(data.user.role);
      router.push(redirectPath);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Login failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Capture user role before clearing data
      const userRole = user?.role;
      queryClient.clear();
      toast.success('Logged out successfully');
      // Redirect to role-specific login page
      const loginRedirect = userRole ? getRoleBasedLoginRedirect(userRole) : '/login';
      router.push(loginRedirect);
    },
    onError: () => {
      // Capture user role before clearing data
      const userRole = user?.role;
      // Clear local data even if API call fails
      queryClient.clear();
      // Auth store will be cleared by the API client
      // Redirect to role-specific login page
      const loginRedirect = userRole ? getRoleBasedLoginRedirect(userRole) : '/login';
      router.push(loginRedirect);
    },
  });

  // Profile query
  const profileQuery = useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => apiClient.getProfile(),
    initialData: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) - user needs to login
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateProfile(profileData),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.auth.user(), updatedUser);
      queryClient.setQueryData(queryKeys.auth.profile(), updatedUser);
      useAuthStore.getState().updateUser(updatedUser);
      
      // Invalidate role-specific profile queries
      const userRole = updatedUser.role;
      if (userRole === 'ADMIN') {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      } else if (userRole === 'SPECIAL_EDUCATOR') {
        queryClient.invalidateQueries({ queryKey: queryKeys.specialEducator.profile() });
      } else if (userRole === 'SUPER_SPECIAL_EDUCATOR') {
        queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.profile() });
      } else if (userRole === 'PARENT') {
        queryClient.invalidateQueries({ queryKey: queryKeys.parent.profile() });
      } else if (userRole === 'CENTER' || userRole === 'SCHOOL_VIEWER') {
        queryClient.invalidateQueries({ queryKey: queryKeys.centers.dashboard() });
      }
      
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      apiClient.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to change password');
    },
  });

  const getRoleBasedRedirect = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'SUPER_SPECIAL_EDUCATOR':
        return '/super-special-educator';
      case 'SPECIAL_EDUCATOR':
        return '/educator/dashboard';
      case 'CENTER':
        return '/center/dashboard';
      case 'PARENT':
        return '/parent/dashboard';
      case 'SCHOOL_VIEWER':
        return '/school-viewer/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getRoleBasedLoginRedirect = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '/login/admin';
      case 'SUPER_SPECIAL_EDUCATOR':
        return '/login/super-special-educator';
      case 'SPECIAL_EDUCATOR':
        return '/login/special-educator';
      case 'CENTER':
        return '/login/center';
      case 'PARENT':
        return '/login/parent';
      case 'SCHOOL_VIEWER':
        return '/login/school-viewer';
      default:
        return '/login';
    }
  };

  // Use the auth store for authentication state
  const authState = useAuthStore();
  const isAuthenticated = authState.isAuthenticated && !!profileQuery.data && !profileQuery.isError;
  const user = profileQuery.data || authState.user;

  return {
    // State
    user,
    isAuthenticated,
    isLoading: profileQuery.isLoading,
    
    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    
    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    
    // Utilities
    getRoleBasedRedirect,
    getRoleBasedLoginRedirect,
  };
}
