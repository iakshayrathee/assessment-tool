'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { LoginRequest } from '@/types';
import { debugAuthState, fixAuthState, clearAuthState, getAuthLogs, clearAuthLogs, checkTokenValidity } from '@/lib/utils/authDebug';

// Function to decode JWT token
const decodeJwt = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid token format' };
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch (e) {
    return { error: 'Failed to decode token' };
  }
};

export default function TestAuthPage() {
  const [tokenFromStore, setTokenFromStore] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string>('');
  const [logs, setLogs] = useState<any[]>([]);
  const [tokenValidity, setTokenValidity] = useState<any>(null);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [tokenDetails, setTokenDetails] = useState<any>(null);

  // Get auth from hook
  const { user, isAuthenticated, login } = useAuth();

  // Get the token from the Zustand store and debug info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().getToken();
      setTokenFromStore(token);

      if (token) {
        // Decode token
        const decoded = decodeJwt(token);
        setDecodedToken(decoded);

        // Get token details
        analyzeToken(token);
      }

      // Get debug info
      refreshDebugInfo();

      // Get logs
      refreshLogs();

      // Check token validity
      checkTokenValidity().then(setTokenValidity);
    }
  }, []);

  // Function to refresh debug info
  const refreshDebugInfo = () => {
    const info = {
      tokenInStore: useAuthStore.getState().token !== null,
      userInStore: useAuthStore.getState().user !== null,
      isAuthenticated: useAuthStore.getState().isAuthenticated,
      tokenInLocalStorage: typeof window !== 'undefined' ? localStorage.getItem('token') !== null : false,
      userInLocalStorage: typeof window !== 'undefined' ? localStorage.getItem('user') !== null : false,
    };
    setDebugInfo(info);

    // Update token display
    setTokenFromStore(useAuthStore.getState().getToken());
  };

  // Function to refresh logs
  const refreshLogs = () => {
    setLogs(getAuthLogs());
  };

  // Function to clear logs
  const handleClearLogs = () => {
    clearAuthLogs();
    refreshLogs();
  };

  // Function to check token validity
  const handleCheckToken = async () => {
    const validity = await checkTokenValidity();
    setTokenValidity(validity);
  };

  // Function to analyze token
  const analyzeToken = (token: string | null) => {
    if (!token) {
      setTokenDetails(null);
      return;
    }

    try {
      // Check token format
      const parts = token.split('.');
      const isJwtFormat = parts.length === 3;

      // Try to decode payload
      let payload = null;
      let header = null;
      let isExpired = false;
      let expiryDate = null;
      let timeUntilExpiry = null;

      if (isJwtFormat) {
        try {
          header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
          payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

          if (payload.exp) {
            expiryDate = new Date(payload.exp * 1000);
            const now = new Date();
            isExpired = expiryDate < now;
            timeUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
          }
        } catch (e) {
          console.error('Error decoding token parts:', e);
        }
      }

      setTokenDetails({
        format: {
          isJwtFormat,
          parts: parts.length,
          length: token.length,
        },
        header,
        payload,
        expiry: {
          expiryDate: expiryDate?.toISOString(),
          isExpired,
          timeUntilExpiry,
        },
      });
    } catch (e) {
      console.error('Error analyzing token:', e);
      setTokenDetails({ error: 'Failed to analyze token' });
    }
  };

  // Test API call
  const testApiCall = async () => {
    try {
      setError(null);
      setApiResponse(null);
      const response = await apiClient.getAdminDashboard();
      setApiResponse(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);

      // Log more details if available
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
      }
    } finally {
      refreshDebugInfo();
    }
  };

  // Handle login
  const handleLogin = async () => {
    try {
      setLoginStatus('Logging in...');
      await login({ email, password });
      setLoginStatus('Login successful');
      refreshDebugInfo();
    } catch (err: any) {
      setLoginStatus(`Login failed: ${err.message}`);
      console.error('Login Error:', err);
    }
  };

  // Handle logout
  const handleLogout = () => {
    useAuthStore.getState().clearAuth();
    refreshDebugInfo();
    setLoginStatus('Logged out');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>

      <div className="mb-6 p-4 bg-muted rounded-md">
        <h2 className="text-lg font-semibold mb-2">Current Auth State:</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Is Authenticated:</p>
            <p className={isAuthenticated ? "text-success" : "text-destructive"}>
              {isAuthenticated ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <p className="font-medium">Current User:</p>
            <p>{user ? user.email : "Not logged in"}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-muted rounded-md">
        <h2 className="text-lg font-semibold mb-2">Token from Zustand Store:</h2>
        {tokenFromStore ? (
          <div>
            <p className="mb-2">Token exists:</p>
            <pre className="bg-muted p-2 rounded overflow-auto max-w-full">
              {tokenFromStore.substring(0, 20)}...
            </pre>
          </div>
        ) : (
          <p className="text-destructive">No token found in store</p>
        )}
      </div>

      <div className="mb-6 p-4 bg-primary/10 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Login Test:</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="admin@knowled.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="admin123"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-success text-white rounded hover:bg-green-600"
            >
              Login
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
          {loginStatus && (
            <p className={loginStatus.includes('failed') ? "text-destructive" : "text-success"}>
              {loginStatus}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={testApiCall}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-primary"
        >
          Test API Call (Admin Dashboard)
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">
          <h2 className="text-lg font-semibold mb-2">Error:</h2>
          <p>{error}</p>
        </div>
      )}

      {apiResponse && (
        <div className="mb-6 p-4 bg-success/10 rounded-md">
          <h2 className="text-lg font-semibold mb-2">API Response:</h2>
          <pre className="bg-muted p-2 rounded overflow-auto max-w-full">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-6 p-4 bg-muted rounded-md">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        {debugInfo ? (
          <pre className="bg-muted p-2 rounded overflow-auto max-w-full">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        ) : (
          <p>No debug info available</p>
        )}
      </div>

      <div className="mb-6 p-4 bg-warning/10 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Debug Actions:</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              useAuthStore.getState().clearAuth();
              localStorage.clear();
              sessionStorage.clear();
              refreshDebugInfo();
              refreshLogs();
              setTokenValidity(null);
            }}
            className="px-4 py-2 bg-warning text-white rounded hover:bg-yellow-600"
          >
            Clear All Auth Data
          </button>

          <button
            onClick={() => {
              refreshDebugInfo();
              refreshLogs();
              handleCheckToken();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-primary"
          >
            Refresh All Info
          </button>

          <button
            onClick={handleCheckToken}
            className="px-4 py-2 bg-success text-white rounded hover:bg-green-600"
          >
            Check Token Validity
          </button>

          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Go to Login Page
          </button>
        </div>
      </div>

      {/* Token Inspection */}
      <div className="mb-6 p-4 bg-primary/10 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Token Inspection:</h2>
        {tokenFromStore ? (
          <div className="space-y-4">
            <div className="bg-background/80 p-3 rounded">
              <h3 className="font-medium mb-2">Raw Token:</h3>
              <div className="bg-muted p-2 rounded text-xs overflow-auto max-h-20">
                {tokenFromStore}
              </div>
            </div>

            {tokenDetails && (
              <div className="bg-background/80 p-3 rounded">
                <h3 className="font-medium mb-2">Token Analysis:</h3>
                <div className="space-y-2">
                  <div>
                    <p><strong>Format:</strong> {tokenDetails.format?.isJwtFormat ? 'Valid JWT' : 'Invalid format'}</p>
                    <p><strong>Parts:</strong> {tokenDetails.format?.parts}</p>
                    <p><strong>Length:</strong> {tokenDetails.format?.length} characters</p>
                  </div>

                  {tokenDetails.header && (
                    <div>
                      <h4 className="font-medium">Header:</h4>
                      <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-20">
                        {JSON.stringify(tokenDetails.header, null, 2)}
                      </pre>
                    </div>
                  )}

                  {tokenDetails.payload && (
                    <div>
                      <h4 className="font-medium">Payload:</h4>
                      <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(tokenDetails.payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {tokenDetails.expiry && tokenDetails.expiry.expiryDate && (
                    <div>
                      <h4 className="font-medium">Expiration:</h4>
                      <p className={tokenDetails.expiry.isExpired ? 'text-destructive' : 'text-success'}>
                        <strong>Expires:</strong> {tokenDetails.expiry.expiryDate}
                      </p>
                      <p>
                        <strong>Status:</strong> {tokenDetails.expiry.isExpired ? 'Expired' : 'Valid'}
                      </p>
                      {!tokenDetails.expiry.isExpired && (
                        <p>
                          <strong>Time until expiry:</strong> {tokenDetails.expiry.timeUntilExpiry} seconds
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => analyzeToken(tokenFromStore)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-primary text-sm"
              >
                Refresh Analysis
              </button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No token available to inspect</p>
        )}
      </div>

      {/* Token Validity */}
      {tokenValidity && (
        <div className={`mb-6 p-4 rounded-md ${tokenValidity.valid ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <h2 className="text-lg font-semibold mb-2">Token Validity Check:</h2>
          <div className="bg-background/80 p-3 rounded">
            <p><strong>Status:</strong> {tokenValidity.valid ? 'Valid' : 'Invalid'}</p>
            <p><strong>Message:</strong> {tokenValidity.message}</p>
            {tokenValidity.expiry && (
              <p><strong>Expiry:</strong> {tokenValidity.expiry.toString()}</p>
            )}
            {tokenValidity.error && (
              <p><strong>Error:</strong> {tokenValidity.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Persistent Logs */}
      <div className="mb-6 p-4 bg-muted rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Persistent Logs:</h2>
          <div className="space-x-2">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-primary text-sm"
            >
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1 bg-destructive text-white rounded hover:bg-red-600 text-sm"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {showLogs && logs.length > 0 ? (
          <div className="bg-background/80 p-3 rounded max-h-96 overflow-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded ${log.level === 'error' ? 'bg-destructive/10' : log.level === 'warn' ? 'bg-warning/10' : 'bg-primary/10'}`}
              >
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  <span className={`font-medium ${log.level === 'error' ? 'text-destructive' : log.level === 'warn' ? 'text-warning' : 'text-primary'}`}>
                    {log.level.toUpperCase()}
                  </span>
                </div>
                <p className="font-medium">{log.message}</p>
                {log.data && (
                  <pre className="text-xs mt-1 bg-muted p-1 rounded overflow-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        ) : showLogs ? (
          <p className="text-muted-foreground">No logs available</p>
        ) : (
          <p className="text-muted-foreground">Click 'Show Logs' to view {logs.length} log entries</p>
        )}
      </div>
    </div>
  );
}
