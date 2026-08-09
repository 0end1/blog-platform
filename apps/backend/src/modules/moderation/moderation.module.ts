import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensitiveWordEntity } from './sensitive-word.entity';
import { SensitiveWordService } from './sensitive-word.service';

@Module({
  imports: [TypeOrmModule.forFeature([SensitiveWordEntity])],
  providers: [SensitiveWordService],
  exports: [SensitiveWordService],
})
export class ModerationModule {}
