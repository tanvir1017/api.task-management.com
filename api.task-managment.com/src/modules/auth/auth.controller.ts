import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create account (register user)' })
  register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string; redirectTo: string }> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user and get access token' })
  login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user (stateless)' })
  logout(@Req() _req: Request): { message: string } {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  getAllUsers(): Promise<
    {
      id: number;
      email: string;
      username: string;
      fullName: string | null;
      role: UserRole;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[]
  > {
    return this.authService.getAllUsers();
  }
}
