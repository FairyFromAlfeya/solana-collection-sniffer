import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [ProxyModule],
  controllers: [CollectionController],
})
export class ServiceModule {}
