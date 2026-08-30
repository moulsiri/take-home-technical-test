import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    // req.user comes from the JwtStrategy
    const user = await this.usersService.findById(req.user.id);
    if (!user) return null;
    const { passwordHash, ...result } = user;
    return result;
  }
}
