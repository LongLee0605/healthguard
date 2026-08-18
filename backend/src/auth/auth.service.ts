import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new UnauthorizedException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      // Constant-time delay to prevent user enumeration
      await bcrypt.compare(dto.password, '$2b$12$invalid.hash.placeholder.XXXXXXXXXXXXXXX');
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Failed login attempt for email: ${dto.email}`);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Token không hợp lệ');
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string; type?: string }>(
        refreshToken,
        { secret: this.config.get<string>('JWT_REFRESH_SECRET', 'healthguard-refresh-secret') },
      );
      if (payload.type !== 'refresh') throw new UnauthorizedException('Token không hợp lệ');
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, fullName: true, dateOfBirth: true, gender: true, createdAt: true },
      });
      if (!user) throw new UnauthorizedException('Người dùng không tồn tại');
      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Token hết hạn hoặc không hợp lệ');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Không tìm thấy người dùng');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Mật khẩu hiện tại không đúng');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu cũ');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true, message: 'Đã đổi mật khẩu thành công' };
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    fullName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    createdAt: Date;
  }) {
    const accessPayload = { sub: user.id, email: user.email };
    const refreshPayload = { sub: user.id, email: user.email, type: 'refresh' };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.config.get<string>('JWT_SECRET', 'healthguard-dev-secret'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'healthguard-refresh-secret'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth?.toISOString(),
        gender: user.gender ?? undefined,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}
