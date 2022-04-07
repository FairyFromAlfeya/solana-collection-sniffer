import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionService } from './collection.service';
import { CollectionSubscriber } from './collection.subscriber';
import { Collection } from './entities/collection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Collection])],
  providers: [CollectionService, CollectionSubscriber],
  exports: [CollectionService],
})
export class ManagerModule {}
