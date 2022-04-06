import { Module } from '@nestjs/common';
import { ManagerModule } from '../manager/manager.module';
import { CollectionServiceProxy } from './collection-service.proxy';

@Module({
  imports: [ManagerModule],
  providers: [CollectionServiceProxy],
  exports: [CollectionServiceProxy],
})
export class ProxyModule {}
