import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionService } from './collection.service';
import { CollectionSubscriber } from './collection.subscriber';
import { Collection } from './entities/collection.entity';
import { NftService } from './nft.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collection])],
  providers: [CollectionService, CollectionSubscriber, NftService],
  exports: [CollectionService, NftService],
})
export class ManagerModule {}
