import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../../../shared/entities/user.entity';
import { UpdateProfileDto } from '../../../shared/types/user.types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // Get user by ID
  async getUserById(userId: string): Promise<UserEntity | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      return user || null;
    } catch (error) {
      return null;
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<UserEntity | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { username },
      });
      return user || null;
    } catch (error) {
      return null;
    }
  }

  // Get user by reset token
  async getUserByResetToken(resetToken: string): Promise<UserEntity | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { reset_password_token: resetToken },
      });
      return user || null;
    } catch (error) {
      return null;
    }
  }

  // Create or update user profile
  async createOrUpdateUser(
    userId: string,
    username: string,
    avatar?: string,
  ): Promise<UserEntity> {
    let user = await this.getUserById(userId);

    if (user) {
      // Update existing user
      user.username = username;
      if (avatar) {
        user.avatar = avatar;
      }
    } else {
      // Create new user - TypeORM will handle created_at, updated_at and defaults
      user = this.userRepository.create({
        id: userId,
        username,
        avatar: avatar || '',
        passwordHash: '', // Will need to be set elsewhere for security
      });
    }

    return await this.userRepository.save(user);
  }

  // Create new user (for registration)
  async createUser(userData: {
    username: string;
    password_hash: string;
    avatar?: string;
    role?: UserRole;
  }): Promise<UserEntity> {
    const user = this.userRepository.create({
      username: userData.username,
      passwordHash: userData.password_hash,
      avatar: userData.avatar || '',
      role: userData.role || UserRole.USER,
    });

    return await this.userRepository.save(user);
  }

  // Update user password
  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const result = await this.userRepository.update(userId, {
      passwordHash: passwordHash,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  // Update reset token
  async updateResetToken(
    userId: string,
    resetToken: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    const result = await this.userRepository.update(userId, {
      reset_password_token: resetToken || '',
      reset_password_expires: expiresAt || new Date(),
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  // Update user status (activate/deactivate)
  async updateUserStatus(userId: string, isActive: boolean): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_active = isActive;
    return await this.userRepository.save(user);
  }

  // Get all users (for admin purposes)
  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    const result = await this.userRepository.delete(userId);
    
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  // Check if username exists
  async usernameExists(username: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    return user !== null;
  }

  // Update user profile fields
  async updateUserProfile(userId: string, updates: UpdateProfileDto): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updates);
    return await this.userRepository.save(user);
  }

  // Update user score
  async updateUserScore(userId: string, score: number): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.score = score;
    return await this.userRepository.save(user);
  }

  // Get user score
  async getUserScore(userId: string): Promise<number> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.score;
  }

  // Google OAuth methods
  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    try {
      return await this.userRepository.findOne({
        where: { googleId },
      });
    } catch (error) {
      return null;
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      return await this.userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      return null;
    }
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.googleId = googleId;
    return await this.userRepository.save(user);
  }

  async createGoogleUser(userData: {
    googleId: string;
    email: string;
    fullName: string;
    username: string;
    avatar?: string;
  }): Promise<UserEntity> {
    // Ensure unique username
    let username = userData.username;
    let counter = 1;
    while (await this.usernameExists(username)) {
      username = `${userData.username}${counter}`;
      counter++;
    }

    const user = this.userRepository.create({
      googleId: userData.googleId,
      email: userData.email,
      fullName: userData.fullName,
      username,
      avatar: userData.avatar || '',
      role: UserRole.USER,
      credits: 100, // Initial free credits
      lastCreditRefill: new Date(),
    });

    return await this.userRepository.save(user);
  }

  // Credit management
  async getUserCredits(userId: string): Promise<number> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.credits;
  }

  async deductCredits(userId: string, amount: number): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.credits < amount) {
      throw new Error('Insufficient credits');
    }

    user.credits -= amount;
    return await this.userRepository.save(user);
  }

  async addCredits(userId: string, amount: number): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.credits += amount;
    return await this.userRepository.save(user);
  }

  async refillDailyCredits(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await this.userRepository.find({
      where: {
        is_active: true,
      },
    });

    for (const user of users) {
      const lastRefill = user.lastCreditRefill || new Date(0);
      lastRefill.setHours(0, 0, 0, 0);

      if (lastRefill < today) {
        user.credits = Math.min(user.credits + 50, 200); // Add 50 credits, max 200
        user.lastCreditRefill = new Date();
        await this.userRepository.save(user);
      }
    }
  }
}