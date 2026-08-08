import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { RegisterDto, LoginDto } from '../user/dto/user.dto';
import { Role } from '@blog/shared';
import { JwtPayload } from './strategies/access-jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly ACCESS_TTL = '15m';
  private readonly REFRESH_TTL = '7d';

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  private async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  private issueTokens(payload: JwtPayload): TokenPair {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
      expiresIn: this.ACCESS_TTL,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      expiresIn: this.REFRESH_TTL,
    });
    return { accessToken, refreshToken };
  }

  /** 剔除敏感字段，返回安全用户对象 */
  private toSafeUser(user: UserEntity) {
    const { password: _password, ...safe } = user;
    return safe;
  }

  async register(dto: RegisterDto): Promise<TokenPair & { user: Omit<UserEntity, 'password'> }> {
    // 首个注册用户自动成为管理员，便于初始化后台
    const isFirst = (await this.userService.count()) === 0;
    const hashed = await this.hashPassword(dto.password);
    const user = await this.userService.create({
      email: dto.email,
      username: dto.username,
      password: hashed,
      role: isFirst ? Role.ADMIN : Role.READER,
    });
    const tokens = this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: Omit<UserEntity, 'password'> }> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    const ok = await this.verifyPassword(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    const tokens = this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { ...tokens, user: this.toSafeUser(user) };
  }

  /** 使用已校验的 refresh 令牌载荷签发新令牌对（旋转） */
  async refresh(payload: JwtPayload): Promise<TokenPair> {
    if (!payload?.sub) {
      throw new BadRequestException('无效刷新令牌');
    }
    return this.issueTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }
}
