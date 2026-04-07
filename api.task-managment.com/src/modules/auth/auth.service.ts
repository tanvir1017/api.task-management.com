import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from 'src/common/providers/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
