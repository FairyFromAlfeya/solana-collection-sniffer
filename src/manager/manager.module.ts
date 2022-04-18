import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionService } from './collection.service';
import { CollectionSubscriber } from './collection.subscriber';
import { Collection } from './entities/collection.entity';
import { NftService } from './nft.service';
import { BullModule } from '@nestjs/bull';
import { NftConsumer } from './nft.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collection]),
    BullModule.registerQueue({ name: 'nft' }),
  ],
  providers: [CollectionService, CollectionSubscriber, NftService, NftConsumer],
  exports: [CollectionService, NftService],
})
export class ManagerModule {}
