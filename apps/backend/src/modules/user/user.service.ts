import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { Role, UserStatus } from '@blog/shared';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  /** 创建用户（密码已由调用方加密） */
  async create(dto: { email: string; username: string; password: string; role?: Role }) {
    const exists = await this.repo
      .createQueryBuilder('u')
      .where('u.email = :email OR u.username = :username', {
        email: dto.email,
        username: dto.username,
      })
      .getOne();
    if (exists) {
      throw new ConflictException('邮箱或用户名已存在');
    }
    const user = this.repo.create({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      role: dto.role ?? Role.READER,
    });
    return this.repo.save(user);
  }

  async findByEmail(email: string) {
    // password 列 select:false，此处显式 select 以便校验
    return this.repo.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'username',
        'password',
        'role',
        'status',
        'avatar',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findMany(): Promise<UserEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async updateRole(id: string, role: Role): Promise<UserEntity> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('用户不存在');
    user.role = role;
    return this.repo.save(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserEntity> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('用户不存在');
    user.status = status;
    return this.repo.save(user);
  }

  async remove(id: string): Promise<{ id: string }> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('用户不存在');
    await this.repo.remove(user);
    return { id };
  }

  /** 注册时预检邮箱/用户名是否可用 */
  async checkAvailability(email?: string, username?: string) {
    if (!email && !username) {
      throw new BadRequestException('请提供邮箱或用户名');
    }
    const qb = this.repo.createQueryBuilder('u');
    if (email && username) {
      qb.where('u.email = :email OR u.username = :username', { email, username });
    } else if (email) {
      qb.where('u.email = :email', { email });
    } else {
      qb.where('u.username = :username', { username });
    }
    const existed = await qb.getOne();
    return { available: !existed };
  }
}
