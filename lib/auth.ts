import axios from 'axios';

// --- DTOs ---

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  oldPassword?: string;
  newPassword: string;
}

export interface TravelPreference {
  id: string; // Assuming UUID or similar
  name: string;
}

export interface UpdateUserPreferencesDto {
  preferenceIds: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

// --- API Service ---

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

export const authService = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
        await api.post('/auth/logout');
    } catch (error) {
        console.error("Logout failed on server", error);
    }
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/me');
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordDto): Promise<void> => {
    await api.post('/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordDto): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  changePassword: async (data: ChangePasswordDto): Promise<void> => {
      await api.post('/auth/change-password', data);
  },

  getAllTravelPreferences: async (): Promise<TravelPreference[]> => {
      const response = await api.get<TravelPreference[]>('/travel-preferences');
      return response.data;
  },

  getUserPreferences: async (): Promise<TravelPreference[]> => {
      const response = await api.get<TravelPreference[]>('/users/me/preferences');
      return response.data;
  },

  updateUserPreferences: async (data: UpdateUserPreferencesDto): Promise<TravelPreference[]> => {
      const response = await api.post<TravelPreference[]>('/users/me/preferences', data);
      return response.data;
  },
  
  // Note: simpler check not possible with httpOnly cookies without making a request.
  // We'll rely on getProfile failing or succeeding to determine auth state.
};
