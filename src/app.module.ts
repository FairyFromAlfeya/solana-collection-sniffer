import { Module } from '@nestjs/common';
import { ServiceModule } from './service/service.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: true }),
    ClientsModule,
    ServiceModule,
  ],
})
export class AppModule {}
