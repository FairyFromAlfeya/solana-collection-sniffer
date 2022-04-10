import { Injectable } from '@nestjs/common';
import {
  CONNECTION,
  getNftDataByMint,
  MarketActionEntity,
  nftExtractor,
  nftRarer,
  priceExtractor,
} from 'karneges-sbt';
import { PublicKey } from '@solana/web3.js';
import { lastValueFrom } from 'rxjs';
import { Cacheable } from './interfaces/cachable.interface';
import { Nft } from './interfaces/nft.interface';
import { Redis } from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { NftStatus } from './interfaces/nft-status.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NftUpdatedEvent } from '../eventa/nft-updated.event';

@Injectable()
export class SolanaService extends Cacheable<Nft> {
  private client: Redis;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
    this.client = this.redisService.getClient();
  }

  protected getCache(id: string): Promise<Nft> {
    return this.client
      .get(`${id}_nft_solana_collection_sniffer`)
      .then((nft) => (nft ? JSON.parse(nft) : null));
  }

  protected async setCache(id: string, value: Nft): Promise<void> {
    await this.client.set(
      `${id}_nft_solana_collection_sniffer`,
      JSON.stringify(value),
      'EX',
      process.env.NFT_CACHE_EXPIRATION_SECONDS,
    );
  }

  commitUpdatedNft(nft: MarketActionEntity) {
    this.eventEmitter.emit(
      'nft.updated',
      new NftUpdatedEvent({
        mint: nft.mint,
        createdAt: new Date(nft.timestamp * 1000).toISOString(),
        price: 1,
        owner: 'ewr',
        status: NftStatus.NFT_STATUS_CANCEL_LISTING,
        rarity: 2,
        collection: {
          name: 'collection',
          address: 'address',
          floor: 0.123,
        },
      }),
    );
  }

  protected async getValue(id: string): Promise<Nft> {
    const price = await SolanaService.price(id).catch(() => ({
      mint: '',
      price: 0,
      timestamp: 0,
    }));
    const rare = await SolanaService.nftRarer(id);

    return Promise.resolve({
      id,
      mint: price.mint,
      price: 12,
      rarity: rare[0].probability,
      owner: 'ewr',
      status: NftStatus.NFT_STATUS_CANCEL_LISTING,
      createdAt: new Date(price.timestamp * 1000).toISOString(),
      collection: {
        name: 'collection',
        address: 'address',
        floor: 0.123,
      },
    });
  }

  extractNftsAddressesFromCollection(id: string): Promise<string[]> {
    return lastValueFrom(
      nftExtractor({
        candyMachine: new PublicKey(id),
        connection: CONNECTION,
      }),
    );
  }

  private static getNftDataByMint(id: string) {
    return getNftDataByMint({
      connection: CONNECTION,
      mint: new PublicKey(id),
    });
  }

  private static nftRarer(id: string) {
    return lastValueFrom(this.getNftDataByMint(id)).then((data) =>
      nftRarer([{ mint: id, parsedData: data.parsedData }]),
    );
  }

  private static price(id: string): Promise<MarketActionEntity> {
    return lastValueFrom(
      priceExtractor({ connection: CONNECTION, nft: new PublicKey(id) }),
    );
  }
}
