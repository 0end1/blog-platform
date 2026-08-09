import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensitiveWordEntity } from './sensitive-word.entity';

/**
 * 敏感词服务（S4-03）：内置内存词表（Set）提供 O(1) 命中检测，
 * 数据源为数据库 sensitive_words 表，启动时加载进内存，写入时同步更新。
 */
@Injectable()
export class SensitiveWordService implements OnModuleInit {
  private readonly logger = new Logger(SensitiveWordService.name);
  private readonly words = new Set<string>();

  constructor(
    @InjectRepository(SensitiveWordEntity)
    private readonly repo: Repository<SensitiveWordEntity>,
  ) {}

  async onModuleInit() {
    const all = await this.repo.find();
    all.forEach((w) => this.words.add(w.word));
    this.logger.log(`已加载敏感词 ${this.words.size} 条`);
  }

  /** 全部敏感词 */
  async list(): Promise<SensitiveWordEntity[]> {
    return this.repo.find({ order: { word: 'ASC' } });
  }

  /** 命中检测：返回命中的首个敏感词，未命中返回 null */
  async match(text: string): Promise<string | null> {
    if (!text) return null;
    for (const w of this.words) {
      if (w && text.includes(w)) return w;
    }
    return null;
  }

  /** 新增敏感词 */
  async add(word: string): Promise<SensitiveWordEntity> {
    const trimmed = (word || '').trim();
    if (!trimmed) throw new Error('敏感词不能为空');
    const exists = await this.repo.findOne({ where: { word: trimmed } });
    if (exists) return exists;
    const entity = await this.repo.save(this.repo.create({ word: trimmed }));
    this.words.add(trimmed);
    return entity;
  }

  /** 删除敏感词 */
  async remove(id: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (entity) {
      this.words.delete(entity.word);
      await this.repo.delete(id);
    }
  }
}
