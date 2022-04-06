import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionService } from './collection.service';
import { CollectionSubscriber } from './collection.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [CollectionService, CollectionSubscriber],
  exports: [CollectionService],
})
export class ManagerModule {}
