import { CacheModule, Global, Module } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { RedisModule } from 'nestjs-redis/index';
import { redisConfig } from '../configs/redis.config';
import { ConfigService } from '@nestjs/config';
import { ConsumeService } from './consume.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => redisConfig(configService),
      inject: [ConfigService],
    }),
    CacheModule.register(),
  ],
  providers: [SolanaService, ConsumeService],
  exports: [SolanaService],
})
export class ClientsModule {}
