import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  NotFoundException,
  UseGuards,
  Request,
} from "@nestjs/common";
import { UserService } from "../services/user.service";
import { SaveUserProfileDto, UpdateProfileDto } from "../../../shared/types/user.types";
import { AuthGuard } from "../../auth/guards/auth.guard";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  @UseGuards(AuthGuard)
  async getProfile(@Request() req: Request & { user: any }) {
    const user = await this.userService.getUserById(req.user.id);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  @Post("profile")
  async saveProfile(@Body() body: SaveUserProfileDto) {
    return this.userService.createOrUpdateUser(
      body.userId,
      body.username,
      body.avatar
    );
  }

  @Patch("profile")
  @UseGuards(AuthGuard)
  async updateProfile(
    @Request() req: Request & { user: any },
    @Body() updateData: UpdateProfileDto
  ) {
    return await this.userService.updateUserProfile(req.user.id, updateData);
  }

  @Get("credits")
  @UseGuards(AuthGuard)
  async getCredits(@Request() req: Request & { user: any }) {
    const credits = await this.userService.getUserCredits(req.user.id);
    return { credits };
  }

  @Post("credits/deduct")
  @UseGuards(AuthGuard)
  async deductCredits(
    @Request() req: Request & { user: any },
    @Body() body: { amount: number }
  ) {
    return await this.userService.deductCredits(req.user.id, body.amount);
  }
}
