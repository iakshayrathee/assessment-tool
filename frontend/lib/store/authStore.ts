import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

// Helper function to get token from localStorage directly
// This is used as a fallback during initialization
const getTokenFromLocalStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to get user from localStorage directly
// This is used as a fallback during initialization
const getUserFromLocalStorage = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }
  return null;
};

// Helper function to sync store with localStorage
const syncToLocalStorage = (token: string | null, user: User | null) => {
  if (typeof window !== 'undefined') {
    console.log('Syncing auth state to localStorage:', { hasToken: !!token, hasUser: !!user });
    
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }
};

interface AuthState {
  token: string | null;
  user: User | null;
  expiresIn: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string, user: User, expiresIn: string) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: getTokenFromLocalStorage(),
      user: getUserFromLocalStorage(),
      expiresIn: null,
      isAuthenticated: !!getTokenFromLocalStorage(),
      
      setAuth: (token, user, expiresIn) => {
        console.log('Setting auth in store:', { hasToken: !!token, hasUser: !!user });
        
        // Update the store
        set({
          token,
          user,
          expiresIn,
          isAuthenticated: !!token,
        });
        
        // Sync to localStorage
        syncToLocalStorage(token, user);
        
        // Verify the update was successful
        setTimeout(() => {
          const currentToken = get().token;
          console.log('Auth store update verification:', { 
            tokenSet: token === currentToken,
            currentToken: currentToken ? `${currentToken.substring(0, 10)}...` : 'null'
          });
        }, 0);
      },
      
      clearAuth: () => {
        console.log('Clearing auth state from store');
        
        // Update the store
        set({
          token: null,
          user: null,
          expiresIn: null,
          isAuthenticated: false,
        });
        
        // Sync to localStorage
        syncToLocalStorage(null, null);
        
        // Verify the update was successful
        setTimeout(() => {
          const currentToken = get().token;
          console.log('Auth store clear verification:', { tokenIsNull: currentToken === null });
        }, 0);
      },
      
      updateUser: (user) => {
        console.log('Updating user in store');
        
        // Update the store
        set((state) => ({
          ...state,
          user,
        }));
        
        // Sync to localStorage
        syncToLocalStorage(get().token, user);
      },
      
      getToken: () => {
        const token = get().token;
        console.log('Getting token from store:', { hasToken: !!token });
        return token;
      },
    }),
    {
      name: 'knowled-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        expiresIn: state.expiresIn,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Initialize the store with values from localStorage if available
if (typeof window !== 'undefined') {
  const token = getTokenFromLocalStorage();
  const user = getUserFromLocalStorage();
  
  if (token && user) {
    useAuthStore.getState().setAuth(token, user, '');
  }
}
