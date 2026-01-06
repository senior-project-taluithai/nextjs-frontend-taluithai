export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface TravelPreference {
  id: string; // Assuming UUID or similar
  name: string;
}

export interface UpdateUserPreferencesDto {
  preferenceIds: string[];
}
