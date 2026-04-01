import { useAuthStore } from '@/lib/store/authStore';
import { User, UserRole } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockUser: User = {
  id: 'user-1',
  email: 'test@knowled.com',
  role: UserRole.SPECIAL_EDUCATOR,
  isActive: true,
  profile: { fullName: 'Test User' },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset the store to its initial state
    useAuthStore.setState({
      token: null,
      user: null,
      expiresIn: null,
      isAuthenticated: false,
    });
  });

  it('starts with unauthenticated state when no localStorage data', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('setAuth updates token, user, and isAuthenticated', () => {
    useAuthStore.getState().setAuth('test-token-123', mockUser, '24h');

    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token-123');
    expect(state.user).toEqual(mockUser);
    expect(state.expiresIn).toBe('24h');
    expect(state.isAuthenticated).toBe(true);
  });

  it('setAuth syncs to localStorage', () => {
    useAuthStore.getState().setAuth('sync-token', mockUser, '1h');

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'sync-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('clearAuth resets all auth state', () => {
    useAuthStore.getState().setAuth('token', mockUser, '24h');
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clearAuth removes from localStorage', () => {
    useAuthStore.getState().setAuth('token', mockUser, '24h');
    useAuthStore.getState().clearAuth();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  it('updateUser updates user while keeping token', () => {
    useAuthStore.getState().setAuth('token-1', mockUser, '24h');

    const updatedUser = { ...mockUser, email: 'updated@knowled.com' };
    useAuthStore.getState().updateUser(updatedUser);

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('updated@knowled.com');
    expect(state.token).toBe('token-1');
  });

  it('getToken returns the stored token', () => {
    useAuthStore.getState().setAuth('my-token', mockUser, '24h');
    expect(useAuthStore.getState().getToken()).toBe('my-token');
  });

  it('getToken returns null when no token is set', () => {
    expect(useAuthStore.getState().getToken()).toBeNull();
  });
});
