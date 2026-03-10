
import axios from 'axios';
import {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
    AuthResponse
} from '../dtos/auth.dto';
import {
    UserProfile,
    TravelPreference,
    UpdateUserPreferencesDto,
    RecommendationPreferences,
    UpdateRecommendationPreferencesDto
} from '../dtos/user.dto';

// Re-export for compatibility
export type {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
    AuthResponse,
    UserProfile,
    TravelPreference,
    UpdateUserPreferencesDto,
    RecommendationPreferences,
    UpdateRecommendationPreferencesDto
};

import { api } from '../api-client';

// --- API Service ---


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

  getRecommendationPreferences: async (): Promise<RecommendationPreferences> => {
      const response = await api.get<RecommendationPreferences>('/users/me/recommendation-preferences');
      return response.data;
  },

  updateRecommendationPreferences: async (data: UpdateRecommendationPreferencesDto): Promise<RecommendationPreferences> => {
      const response = await api.post<RecommendationPreferences>('/users/me/recommendation-preferences', data);
      return response.data;
  },
  
  // Note: simpler check not possible with httpOnly cookies without making a request.
  // We'll rely on getProfile failing or succeeding to determine auth state.
};
