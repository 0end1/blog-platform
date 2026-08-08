import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  /** 列表：默认返回全部分类（含父子层级由 parentId 表达） */
  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('分类不存在');
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOne({ where: { slug } });
    if (!category) throw new NotFoundException('分类不存在');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    if (dto.parentId) {
      const parent = await this.categoryRepo.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) throw new BadRequestException('父分类不存在');
    }
    const existed = await this.categoryRepo.findOne({
      where: [{ slug: dto.slug }, { name: dto.name }],
    });
    if (existed) throw new ConflictException('分类名称或别名已存在');
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.findOne(id);
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('不能将分类设为自身的父级');
    }
    if (dto.slug && dto.slug !== category.slug) {
      const conflict = await this.categoryRepo.findOne({
        where: { slug: dto.slug },
      });
      if (conflict) throw new ConflictException('分类别名已存在');
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<{ id: string }> {
    const category = await this.findOne(id);
    // 将子分类提升为一级分类，避免外键悬空
    await this.categoryRepo.update({ parentId: id }, { parentId: null });
    await this.categoryRepo.remove(category);
    return { id };
  }
}
