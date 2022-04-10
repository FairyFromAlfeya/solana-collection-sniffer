import { SolanaService } from '../solana.service';
import { Test } from '@nestjs/testing';
import { RedisModule } from 'nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../../configs/redis.config';

describe('Solana Service', () => {
  let solanaService: SolanaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
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

  describe('validate()', () => {
    it('should return price', async () => {
      const addresses = await solanaService.get(
        'D9ZUMRWs3ZqLT86QLFyZg59NqTgx3RWh8XbgDw4szY6S',
      );

      console.log(addresses);
    }, 100000);
  });
});
