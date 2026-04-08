import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type RequestUser = {
  id: number;
  role: UserRole;
};

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getAllUsersWithQuery(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(
    @Param('id', ParseIntPipe) userId: number,
    @Req() req: Request,
  ) {
    const actor = req.user as RequestUser;
    const isAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.SYSTEM_ADMIN;
    const isSelf = actor.id === userId;

    // Users can only view their own profile, admins can view any profile
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Update user profile' })
  updateUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.updateUser(
      userId,
      updateUserDto,
      req.user as RequestUser,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Delete user account' })
  deleteUser(
    @Param('id', ParseIntPipe) userId: number,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.usersService.deleteUser(userId, req.user as RequestUser);
  }
}
