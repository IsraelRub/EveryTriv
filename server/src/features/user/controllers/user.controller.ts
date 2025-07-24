import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "../services/user.service";
import { UserProfileDto } from "../../../shared/types/user.types";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  async getProfile(@Query("userId") userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  @Post("profile")
  async saveProfile(@Body() body: UserProfileDto) {
    return this.userService.createOrUpdateUser(
      body.userId,
      body.username,
      body.avatar
    );
  }
}
