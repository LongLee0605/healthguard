import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TtlCache } from '../common/ttl-cache';

type JwtUser = { id: string; email: string; fullName: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly userCache = new TtlCache<JwtUser | null>(45_000, 100);

  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'healthguard-dev-secret'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const cached = this.userCache.get(payload.sub);
    if (cached !== undefined) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, fullName: true },
    });
    const mapped = user ? { id: user.id, email: user.email, fullName: user.fullName } : null;
    this.userCache.set(payload.sub, mapped);
    return mapped;
  }
}
