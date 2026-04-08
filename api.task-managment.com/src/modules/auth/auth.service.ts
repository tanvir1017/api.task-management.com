import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from 'src/common/providers/prisma.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
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

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.bootstrapDefaultUsers();
  }

  private async bootstrapDefaultUsers(): Promise<void> {
    try {
      this.logger.log('Starting bootstrap of default users...');

      // Ensure system admin/admin user
      await this.ensureSystemAdmin();

      // Ensure normal user
      await this.ensureNormalUser();

      this.logger.log('Bootstrap of default users completed successfully');
    } catch (error) {
      this.logger.error(
        `Failed to bootstrap default users: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - let the application start even if bootstrap fails
    }
  }

  async ensureSystemAdmin(): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';
    const email =
      process.env.SYSTEM_ADMIN_EMAIL ?? 'admin@taskmanagement.local';
    const password =
      process.env.SYSTEM_ADMIN_PASSWORD ?? 'change-this-strong-password';
    const usernameFromEnv = process.env.SYSTEM_ADMIN_USERNAME ?? 'systemadmin';
    const fullName =
      process.env.SYSTEM_ADMIN_FULL_NAME || 'System Administrator';
    const bootstrapRole = await this.resolveBootstrapRole();

    if (
      isProduction &&
      (!process.env.SYSTEM_ADMIN_EMAIL ||
        !process.env.SYSTEM_ADMIN_PASSWORD ||
        !process.env.SYSTEM_ADMIN_USERNAME)
    ) {
      throw new InternalServerErrorException(
        'Missing SYSTEM_ADMIN bootstrap environment variables',
      );
    }

    const existingSystemAdmin = await this.prismaService.user.findFirst({
      where: { role: bootstrapRole },
      select: { id: true },
    });

    if (existingSystemAdmin) {
      return;
    }

    const existingEmail = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      await this.prismaService.user.update({
        where: { id: existingEmail.id },
        data: {
          role: bootstrapRole,
          isActive: true,
          fullName,
        },
      });
      return;
    }

    const username = await this.buildUniqueUsername(usernameFromEnv);
    const hashedPassword = await hash(password, 10);

    await this.prismaService.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        role: bootstrapRole,
      },
    });

    this.logger.log(`System Admin user created: ${email}`);
  }

  private async ensureNormalUser(): Promise<void> {
    const email = process.env.DEFAULT_USER_EMAIL ?? 'user@taskmanagement.local';
    const password = process.env.DEFAULT_USER_PASSWORD ?? 'user-password-123';
    const usernameFromEnv = process.env.DEFAULT_USER_USERNAME ?? 'user';
    const fullName = process.env.DEFAULT_USER_FULL_NAME || 'Normal User';

    const existingNormalUser = await this.prismaService.user.findFirst({
      where: { role: UserRole.USER },
      select: { id: true },
    });

    if (existingNormalUser) {
      return;
    }

    const existingEmail = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      await this.prismaService.user.update({
        where: { id: existingEmail.id },
        data: {
          role: UserRole.USER,
          isActive: true,
          fullName,
        },
      });

      this.logger.log(`Normal user role assigned to: ${email}`);
      return;
    }

    const username = await this.buildUniqueUsername(usernameFromEnv);
    const hashedPassword = await hash(password, 10);

    await this.prismaService.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        role: UserRole.USER,
      },
    });

    this.logger.log(`Normal user created: ${email}`);
  }

  private async resolveBootstrapRole(): Promise<UserRole> {
    try {
      await this.prismaService.user.findFirst({
        where: { role: UserRole.SYSTEM_ADMIN },
        select: { id: true },
      });

      return UserRole.SYSTEM_ADMIN;
    } catch (error: unknown) {
      if (this.isSystemAdminEnumMismatch(error)) {
        console.warn(
          'SYSTEM_ADMIN enum value is not available in database yet. Falling back to ADMIN for bootstrap. Run migration to enable SYSTEM_ADMIN.',
        );

        return UserRole.ADMIN;
      }

      throw error;
    }
  }

  private isSystemAdminEnumMismatch(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return error.message.includes(
      'invalid input value for enum "UserRole": "SYSTEM_ADMIN"',
    );
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; redirectTo: string }> {
    const existingEmail = await this.prismaService.user.findUnique({
      where: { email: registerDto.email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const username = await this.buildUniqueUsername(
      registerDto.username || registerDto.email,
    );

    const hashedPassword = await hash(registerDto.password, 10);

    await this.prismaService.user.create({
      data: {
        email: registerDto.email,
        username,
        password: hashedPassword,
        fullName: registerDto.fullName,
        role: UserRole.USER,
      },
    });

    return {
      message: 'Account created successfully. Please login.',
      redirectTo: '/login',
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prismaService.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('credentials mismatch');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('credentials mismatch');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  logout(): { message: string } {
    return { message: 'Logged out successfully' };
  }

  async getAllUsers(): Promise<{
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
    return this.getAllUsersWithQuery({});
  }

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

  async getCurrentUser(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: this.userSelect,
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateCurrentUser(userId: number, updateProfileDto: UpdateProfileDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new UnauthorizedException('User not found');
    }

    const data: {
      email?: string;
      username?: string;
      fullName?: string | null;
    } = {};

    if (typeof updateProfileDto.email === 'string') {
      data.email = updateProfileDto.email.trim();
    }

    if (typeof updateProfileDto.username === 'string') {
      data.username = updateProfileDto.username.trim();
    }

    if (typeof updateProfileDto.fullName === 'string') {
      data.fullName = updateProfileDto.fullName.trim();
    }

    if (
      data.email === undefined &&
      data.username === undefined &&
      data.fullName === undefined
    ) {
      throw new BadRequestException('No profile changes were provided');
    }

    const conflict = await this.prismaService.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          data.email ? { email: data.email } : undefined,
          data.username ? { username: data.username } : undefined,
        ].filter(Boolean) as Array<{ email?: string; username?: string }>,
      },
      select: { id: true, email: true, username: true },
    });

    if (conflict) {
      if (data.email && conflict.email === data.email) {
        throw new ConflictException('Email already exists');
      }

      if (data.username && conflict.username === data.username) {
        throw new ConflictException('Username already exists');
      }
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data,
      select: this.userSelect,
    });
  }

  private async buildUniqueUsername(seed: string): Promise<string> {
    const normalizedSeed = seed
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 20);

    const base = normalizedSeed || 'user';
    let candidate = base;
    let suffix = 1;

    while (true) {
      const existing = await this.prismaService.user.findUnique({
        where: { username: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      suffix += 1;
      candidate = `${base}${suffix}`;
    }
  }
}
