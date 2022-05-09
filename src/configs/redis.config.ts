import { RedisModuleOptions } from 'nestjs-redis';
import { ConfigService } from '@nestjs/config';

export const redisConfig = (
  configService: ConfigService,
): RedisModuleOptions => ({
  host: configService.get('REDIS_HOST'),
  port: +configService.get('REDIS_PORT'),
  password: configService.get('REDIS_PASSWORD'),
});

export const queueRedisConfig = (
  configService: ConfigService,
): RedisModuleOptions => ({
  host: configService.get('QUEUE_REDIS_HOST'),
  port: +configService.get('QUEUE_REDIS_PORT'),
  password: configService.get('QUEUE_REDIS_PASSWORD'),
});
