import { Module } from '@nestjs/common';
import { CompareController } from './presentation/controllers/compare.controller';

@Module({
  controllers: [CompareController],
})
export class AppModule {}
