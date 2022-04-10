import { RedisModuleOptions } from 'nestjs-redis';
import { ConfigService } from '@nestjs/config';

export const redisConfig = (
  configService: ConfigService,
): RedisModuleOptions => ({
  host: configService.get('REDIS_HOST'),
  port: +configService.get('REDIS_PORT'),
  password: configService.get('REDIS_PASSWORD'),
});
