import { Module } from '@nestjs/common';
import { ServiceModule } from './service/service.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { queueRedisConfig } from './configs/redis.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: true }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: queueRedisConfig(configService),
        limiter: {
          max: 1000,
          duration: 5000,
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule,
    ServiceModule,
  ],
})
export class AppModule {}
