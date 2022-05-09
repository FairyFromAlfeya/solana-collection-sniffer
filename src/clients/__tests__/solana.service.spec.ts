import { SolanaService } from '../solana.service';
import { Test } from '@nestjs/testing';
import { RedisModule } from 'nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../../configs/redis.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MAGIC_EDEN_MARKET_PLACE, marketPlaceSource } from 'karneges-sbt';
import { lastValueFrom, tap } from 'rxjs';
import { Connection } from '@solana/web3.js';

const connection = new Connection(
  'https://rpc.ankr.com/solana/209c23ff8159324d373e166d89207ae8da592a86d02e9a665d75a887f5690f2d',
  {
    wsEndpoint:
      'wss://rpc.ankr.com/solana/ws/209c23ff8159324d373e166d89207ae8da592a86d02e9a665d75a887f5690f2d',
  },
);

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
    it.skip('should return nft', () =>
      expect(
        solanaService.get('D9ZUMRWs3ZqLT86QLFyZg59NqTgx3RWh8XbgDw4szY6S'),
      ).resolves.toBeDefined());

    it('should subscribe', async () => {
      await lastValueFrom(
        marketPlaceSource({
          connection: connection,
          marketPlaceProgram: MAGIC_EDEN_MARKET_PLACE,
        }).pipe(tap((nft) => console.log(Date.now() - nft.timestamp * 1000))),
      );
    }, 10000000);
  });
});
