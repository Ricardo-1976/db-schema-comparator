import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { CompareController } from './controllers/compare.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [CompareController],
})
export class PresentationModule {}
