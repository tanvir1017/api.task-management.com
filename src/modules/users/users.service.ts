import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/common/providers/prisma.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type RequestUser = {
  id: number;
  role: UserRole;
};

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    email: true,
    username: true,
    fullName: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  constructor(private readonly prismaService: PrismaService) {}

  async getAllUsersWithQuery(query: GetUsersQueryDto): Promise<{
    result: {
      id: number;
      email: string;
      username: string;
      fullName: string | null;
      role: UserRole;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      count: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search?.trim()) {
      where.OR = [
        {
          email: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          username: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          fullName: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive === 'true') {
      where.isActive = true;
    } else if (query.isActive === 'false') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        select: this.userSelect,
        orderBy: { createdAt: 'desc' },
        where,
        skip,
        take: limit,
      }),
      this.prismaService.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      result: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        count: users.length,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    actor: RequestUser,
  ): Promise<{
    id: number;
    email: string;
    username: string;
    fullName: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Only allow users to update their own profile, or admins to update any profile
    const isAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.SYSTEM_ADMIN;
    const isSelf = actor.id === userId;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check for email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prismaService.user.findUnique({
        where: { email: updateUserDto.email },
        select: { id: true },
      });
      if (emailExists) {
        throw new ForbiddenException('Email already in use');
      }
    }

    // Check for username uniqueness if username is being updated
    if (
      updateUserDto.username &&
      updateUserDto.username !== existingUser.username
    ) {
      const usernameExists = await this.prismaService.user.findUnique({
        where: { username: updateUserDto.username },
        select: { id: true },
      });
      if (usernameExists) {
        throw new ForbiddenException('Username already in use');
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        email: updateUserDto.email,
        username: updateUserDto.username,
        fullName: updateUserDto.fullName,
      },
      select: this.userSelect,
    });

    return updatedUser;
  }

  async deleteUser(
    userId: number,
    actor: RequestUser,
  ): Promise<{ message: string }> {
    // Only allow users to delete their own profile, or admins to delete any profile
    const isAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.SYSTEM_ADMIN;
    const isSelf = actor.id === userId;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    // Prevent system admin from being deleted
    if (userId === actor.id && actor.role === UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'System admin cannot delete their own account',
      );
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deletion of system admin by regular admins
    if (
      user.role === UserRole.SYSTEM_ADMIN &&
      actor.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException('Cannot delete system admin account');
    }

    await this.prismaService.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  async getUserById(userId: number): Promise<{
    id: number;
    email: string;
    username: string;
    fullName: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return await this.prismaService.user.findUnique({
      where: { id: userId },
      select: this.userSelect,
    });
  }
}
