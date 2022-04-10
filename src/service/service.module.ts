import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { NftController } from './nft.controller';

@Module({
  imports: [ProxyModule],
  controllers: [CollectionController, NftController],
})
export class ServiceModule {}
