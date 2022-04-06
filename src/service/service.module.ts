import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { ProxyModule } from '../proxy/proxy.module';

// Proxy processes data between controllers and db managers
@Module({
  imports: [ProxyModule],
  controllers: [CollectionController],
})
export class ServiceModule {}
