import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from './tag.entity';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
  ) {}

  async findAll(): Promise<TagEntity[]> {
    return this.tagRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<TagEntity> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('标签不存在');
    return tag;
  }

  async findBySlug(slug: string): Promise<TagEntity> {
    const tag = await this.tagRepo.findOne({ where: { slug } });
    if (!tag) throw new NotFoundException('标签不存在');
    return tag;
  }

  async create(dto: CreateTagDto): Promise<TagEntity> {
    const existed = await this.tagRepo.findOne({
      where: [{ slug: dto.slug }, { name: dto.name }],
    });
    if (existed) throw new ConflictException('标签名称或别名已存在');
    const tag = this.tagRepo.create(dto);
    return this.tagRepo.save(tag);
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagEntity> {
    const tag = await this.findOne(id);
    if (dto.slug && dto.slug !== tag.slug) {
      const conflict = await this.tagRepo.findOne({ where: { slug: dto.slug } });
      if (conflict) throw new ConflictException('标签别名已存在');
    }
    Object.assign(tag, dto);
    return this.tagRepo.save(tag);
  }

  async remove(id: string): Promise<{ id: string }> {
    const tag = await this.findOne(id);
    await this.tagRepo.remove(tag);
    return { id };
  }
}
