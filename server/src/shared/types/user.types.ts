export interface UserProfileDto {
  userId: string;
  username: string;
  avatar?: string;
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
