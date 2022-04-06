import { Module } from '@nestjs/common';
import { ServiceModule } from './service/service.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';

// ClientsModule - global
@Module({
  imports: [TypeOrmModule.forRoot(), ClientsModule, ServiceModule],
})
export class AppModule {}
