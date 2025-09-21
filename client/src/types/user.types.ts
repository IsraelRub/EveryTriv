/**
 * User types
 * @module ClientUserTypes
 * @used_by client/src/views/user, client/src/services/auth, client/src/hooks/api
 */
import type {
  AuthCredentials,
  User,
  UserAddress,
  UserPreferencesUpdate,
  UserProfile,
  UserProfileUpdateData,
} from '@shared';
import { DifficultyLevel } from '@shared';

/**
 * Extended user profile update request
 * @used_by client/src/services/auth
 */
export interface ExtendedUserProfileUpdateRequest extends UserProfileUpdateData {
  id?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Notification settings
 * @used_by client/src/views/user/UserProfile.tsx
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  achievements: boolean;
  leaderboard: boolean;
  newsletter: boolean;
}

/**
 * Registration data
 * @used_by client/src/services/auth
 */
export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  favorite_topics: string[];
  address: UserAddress;
  additional_info?: string;
}

/**
 * Registration form data
 *@used_by client/src/views/registration
 */
export interface RegistrationFormData extends Omit<RegistrationData, 'phone' | 'additional_info'> {
  confirmPassword: string;
  phonePrefix: string;
  phone: string; // Override the original phone field
  agreeToTerms: boolean;
  agreeToNewsletter: boolean;
  additionalInfo: string; // Make required in form
  difficulty: DifficultyLevel;
}

// Re-export shared types
export type { User, UserAddress, UserProfile };

// Auth Types
/**
 * User authentication response
 * @used_by client/src/services/auth, client/src/hooks/api
 */
export interface UserAuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

// User Login and Registration Types
/**
 * User login request
 * @used_by client/src/services/auth, client/src/hooks/api
 */
export interface UserLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * User preferences
 * @used_by client/src/views/user/UserProfile.tsx, client/src/services/auth
 */
export type { UserPreferences } from '@shared/types/domain/user/user.types';

/**
 * User profile complete request
 * @used_by client/src/components/user/CompleteProfile.tsx
 */
export interface UserProfileCompleteRequest
  extends Pick<
    RegistrationData,
    'first_name' | 'last_name' | 'date_of_birth' | 'phone' | 'address'
  > {
  additional_info?: string;
}

// User Profile Types
/**
 * User profile update request
 * @used_by client/src/services/auth, client/src/views/user/UserProfile.tsx
 */
export interface UserProfileUpdateRequest extends UserProfileUpdateData {
  bio?: string;
  location?: string;
  preferences?: UserPreferencesUpdate;
}

/**
 * User register request
 * @used_by client/src/services/auth, client/src/views/registration
 */
export interface UserRegisterRequest extends AuthCredentials {
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  favoriteTopics?: string[];
  agreeToTerms: boolean;
  agreeToNewsletter?: boolean;
}
