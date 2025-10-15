import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { LoginRequest, User } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';

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
      queryClient.setQueryData(['user'], data.user);
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
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/login');
    },
    onError: () => {
      // Clear local data even if API call fails
      queryClient.clear();
      // Auth store will be cleared by the API client
      router.push('/login');
    },
  });

  // Profile query
  const profileQuery = useQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.getProfile(),
    initialData: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateProfile(profileData),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user'], updatedUser);
      useAuthStore.getState().updateUser(updatedUser);
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
        return '/super-educator/dashboard';
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
  };
}
