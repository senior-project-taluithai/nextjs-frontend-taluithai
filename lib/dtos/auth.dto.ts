import { UserProfile } from "./user.dto";

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

export interface AuthResponse {
  access_token?: string;
  accessToken?: string;
  user: UserProfile;
}
