import { Module } from '@nestjs/common';
import { ManagerModule } from '../manager/manager.module';
import { CollectionServiceProxy } from './collection-service.proxy';
import { NftServiceProxy } from './nft-service.proxy';

@Module({
  imports: [ManagerModule],
  providers: [CollectionServiceProxy, NftServiceProxy],
  exports: [CollectionServiceProxy, NftServiceProxy],
})
export class ProxyModule {}
