import { SolanaService } from '../solana.service';
import { Test } from '@nestjs/testing';
import { RedisModule } from 'nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../../configs/redis.config';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('SolanaService', () => {
  let solanaService: SolanaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ wildcard: true }),
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule.forRootAsync({
          useFactory: (configService: ConfigService) =>
            redisConfig(configService),
          inject: [ConfigService],
        }),
      ],
      providers: [SolanaService],
    }).compile();

    solanaService = module.get<SolanaService>(SolanaService);
  });

  describe('get()', () => {
    it('should return nft', () =>
      expect(
        solanaService.get('D9ZUMRWs3ZqLT86QLFyZg59NqTgx3RWh8XbgDw4szY6S'),
      ).resolves.toBeDefined());
  });
});
