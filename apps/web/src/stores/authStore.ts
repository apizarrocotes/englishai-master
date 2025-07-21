import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { 
  authAPI, 
  AuthUtils, 
  TokenStorage,
  type User, 
  type LoginCredentials, 
  type RegisterCredentials 
} from '@/lib/auth';

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  microsoftLogin: (token: string) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Initialize auth state
      initialize: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        
        try {
          // Clean any corrupted tokens first
          TokenStorage.clearCorruptedTokens();
          
          const user = await AuthUtils.getCurrentUser();
          set({ 
            user, 
            isLoading: false, 
            isInitialized: true,
            error: null 
          });
        } catch (error) {
          set({ 
            user: null, 
            isLoading: false, 
            isInitialized: true,
            error: null // Don't show error on initialization
          });
        }
      },

      // Login with email/password
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login(credentials);
          
          // Store tokens
          TokenStorage.setTokens(response.tokens);
          
          set({ 
            user: response.user, 
            isLoading: false, 
            error: null 
          });
          
          toast.success('Welcome back!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            user: null, 
            isLoading: false, 
            error: errorMessage 
          });
          
          toast.error(errorMessage);
          throw error;
        }
      },

      // Register new user
      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.register(credentials);
          
          // Store tokens
          TokenStorage.setTokens(response.tokens);
          
          set({ 
            user: response.user, 
            isLoading: false, 
            error: null 
          });
          
          toast.success('Account created successfully!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ 
            user: null, 
            isLoading: false, 
            error: errorMessage 
          });
          
          toast.error(errorMessage);
          throw error;
        }
      },

      // Google OAuth login
      googleLogin: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.googleCallback(token);
          
          // Store tokens
          TokenStorage.setTokens(response.tokens);
          
          set({ 
            user: response.user, 
            isLoading: false, 
            error: null 
          });
          
          toast.success('Welcome!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Google login failed';
          set({ 
            user: null, 
            isLoading: false, 
            error: errorMessage 
          });
          
          toast.error(errorMessage);
          throw error;
        }
      },

      // Microsoft OAuth login
      microsoftLogin: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.microsoftCallback(token);
          
          // Store tokens
          TokenStorage.setTokens(response.tokens);
          
          set({ 
            user: response.user, 
            isLoading: false, 
            error: null 
          });
          
          toast.success('Welcome!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Microsoft login failed';
          set({ 
            user: null, 
            isLoading: false, 
            error: errorMessage 
          });
          
          toast.error(errorMessage);
          throw error;
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await AuthUtils.logout();
          
          set({ 
            user: null, 
            isLoading: false, 
            error: null 
          });
          
          toast.success('Logged out successfully');
        } catch (error) {
          // Still logout locally even if API call fails
          set({ 
            user: null, 
            isLoading: false, 
            error: null 
          });
          
          console.warn('Logout error:', error);
        }
      },

      // Get current user (refresh user data)
      getCurrentUser: async () => {
        const { user: currentUser } = get();
        
        // Don't fetch if no user is logged in
        if (!currentUser && !TokenStorage.hasTokens()) {
          return;
        }
        
        set({ isLoading: true });
        
        try {
          const user = await AuthUtils.getCurrentUser();
          set({ 
            user, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          // Token might be invalid, clear user
          set({ 
            user: null, 
            isLoading: false, 
            error: null 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist user data, not loading states
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Selectors for easier usage
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  getCurrentUser: state.getCurrentUser,
  googleLogin: state.googleLogin,
  microsoftLogin: state.microsoftLogin,
  clearError: state.clearError,
  initialize: state.initialize,
}));