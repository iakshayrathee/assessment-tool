import { useAuthStore } from '@/lib/store/authStore';

// Interface for log entry
interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
  level: 'info' | 'warn' | 'error';
}

// Add a log entry to persistent storage
const addLogEntry = (message: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') => {
  if (typeof window === 'undefined') return;
  
  try {
    const logs: LogEntry[] = JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      message,
      data,
      level
    });
    
    // Keep only the last 50 logs
    sessionStorage.setItem('auth_debug_logs', JSON.stringify(logs.slice(-50)));
  } catch (e) {
    console.error('Failed to add log entry', e);
  }
};

// Get all logs
export const getAuthLogs = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]');
  } catch (e) {
    console.error('Failed to get auth logs', e);
    return [];
  }
};

// Clear all logs
export const clearAuthLogs = () => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem('auth_debug_logs');
  sessionStorage.removeItem('api_error_log');
  sessionStorage.removeItem('auth_state_before_401');
  console.log('Auth logs cleared');
};

// Debug the current auth state
export const debugAuthState = () => {
  if (typeof window === 'undefined') {
    console.log('Running on server, no auth state available');
    return;
  }

  // Check Zustand store
  const authState = useAuthStore.getState();
  console.group('Auth State Debug');
  console.log('Token in Zustand store:', authState.token ? `${authState.token.substring(0, 15)}...` : 'null');
  console.log('User in Zustand store:', authState.user ? `ID: ${authState.user.id}, Email: ${authState.user.email}` : 'null');
  console.log('isAuthenticated in Zustand store:', authState.isAuthenticated);
  
  // Check localStorage
  console.log('Token in localStorage:', localStorage.getItem('token') ? `${localStorage.getItem('token')?.substring(0, 15)}...` : 'null');
  console.log('User in localStorage:', localStorage.getItem('user') ? 'exists' : 'null');
  
  // Check if they match
  const tokenMatches = authState.token === localStorage.getItem('token');
  console.log('Token in store matches localStorage:', tokenMatches);
  
  console.groupEnd();
  
  // Add to persistent logs
  const debugData = {
    tokenInStore: !!authState.token,
    tokenInLocalStorage: !!localStorage.getItem('token'),
    userInStore: !!authState.user,
    userInLocalStorage: !!localStorage.getItem('user'),
    tokenMatches,
    isAuthenticated: authState.isAuthenticated
  };
  
  addLogEntry('Auth state debug', debugData);
  
  return debugData;
};

// Fix auth state by syncing from localStorage to Zustand store
export const fixAuthState = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const tokenFromLocalStorage = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (tokenFromLocalStorage && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAuthStore.getState().setAuth(tokenFromLocalStorage, user, '');
      console.log('Auth state fixed from localStorage');
      addLogEntry('Auth state fixed from localStorage', { success: true });
      return true;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error('Error fixing auth state:', error);
      addLogEntry('Error fixing auth state', { error: error.message }, 'error');
    }
  } else {
    addLogEntry('Cannot fix auth state - missing token or user in localStorage', null, 'warn');
  }
  
  return false;
};

// Clear all auth state
export const clearAuthState = () => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Clear Zustand store
  useAuthStore.getState().clearAuth();
  
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear any other auth-related items
  localStorage.removeItem('knowled-auth-storage');
  
  console.log('Auth state completely cleared');
  addLogEntry('Auth state completely cleared');
};

// Check token validity
export const checkTokenValidity = async () => {
  if (typeof window === 'undefined') {
    return { valid: false, message: 'Running on server' };
  }
  
  const token = useAuthStore.getState().token || localStorage.getItem('token');
  
  if (!token) {
    const result = { valid: false, message: 'No token found' };
    addLogEntry('Token validity check', result, 'warn');
    return result;
  }
  
  try {
    // Try to decode the token (assuming JWT)
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      const result = { valid: false, message: 'Invalid token format' };
      addLogEntry('Token validity check', result, 'error');
      return result;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const result = { valid: false, message: 'Token expired', expiry: new Date(payload.exp * 1000) };
      addLogEntry('Token validity check', result, 'warn');
      return result;
    }
    
    const result = { valid: true, message: 'Token valid', expiry: payload.exp ? new Date(payload.exp * 1000) : 'unknown' };
    addLogEntry('Token validity check', result, 'info');
    return result;
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    const result = { valid: false, message: 'Error checking token', error: error.message };
    addLogEntry('Token validity check', result, 'error');
    return result;
  }
};
