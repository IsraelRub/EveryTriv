import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Request, Res} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../../../shared/types/auth.types';
import { UserService } from '../../user/services/user.service';
import { AuthGuard } from '../guards/auth.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto.username, loginDto.password);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const existingUser = await this.userService.getUserByUsername(registerDto.username);
    if (existingUser) {
      throw new UnauthorizedException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    await this.userService.createUser({
      username: registerDto.username,
      password_hash: hashedPassword,
    });

    return this.authService.login(registerDto.username, registerDto.password);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req: Request & { user: any }) {
    return req.user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body('username') username: string) {
    return this.authService.createPasswordResetToken(username);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthCallback(@Request() req: Request & { user: any }, @Res() res: Response) {
    // Generate JWT for the authenticated user
    const token = await this.authService.generateJWT(req.user);
    
    // Redirect to frontend with token
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@Request() req: Request & { user: any }) {
    return req.user;
  }
}
