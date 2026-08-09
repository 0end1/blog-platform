import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from './article.entity';

/**
 * 定时发布调度器（S4-02）：周期性轮询 status='scheduled' 且到达发布时间的文章，
 * 将其转为 published。不依赖第三方任务队列，使用进程内定时器即可满足单机后台场景。
 */
@Injectable()
export class ScheduledPublishService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledPublishService.name);
  private timer: NodeJS.Timeout;

  constructor(
    @InjectRepository(ArticleEntity)
    private readonly repo: Repository<ArticleEntity>,
  ) {}

  onModuleInit() {
    // 每 30s 轮询一次，避免依赖 @nestjs/schedule 额外依赖
    this.timer = setInterval(() => {
      this.tick().catch((e) => this.logger.error(e));
    }, 30_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    const now = new Date();
    const due = await this.repo
      .createQueryBuilder('article')
      .where('article.status = :s', { s: 'scheduled' })
      .andWhere('article.scheduledPublishAt IS NOT NULL')
      .andWhere('article.scheduledPublishAt <= :now', { now })
      .getMany();

    for (const article of due) {
      article.status = 'published';
      article.publishedAt = now;
      article.scheduledPublishAt = null;
      await this.repo.save(article);
      this.logger.log(`定时发布文章: ${article.slug}`);
    }
  }
}
