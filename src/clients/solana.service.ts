import { Injectable, Logger } from '@nestjs/common';
import {
  CONNECTION,
  getNftDataByMint,
  MarketActionEntity,
  nftExtractor,
  nftRarer,
  ParsedNFTData,
  priceExtractor,
} from 'karneges-sbt';
import { PublicKey } from '@solana/web3.js';
import { lastValueFrom } from 'rxjs';
import { Cacheable } from './interfaces/cachable.interface';
import { Nft } from '../manager/interfaces/nft.interface';
import { Redis } from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { NftStatus } from '../manager/interfaces/nft-status.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NftUpdatedEvent } from '../eventa/nft-updated.event';
import { Marketplace } from '../manager/interfaces/marketplace.interface';

@Injectable()
export class SolanaService extends Cacheable<Nft> {
  private readonly logger = new Logger('SolanaService');
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
    this.logger.log(
      `Set cache for NFT ${id} with values: ${JSON.stringify(value)}`,
    );

    await this.client.set(
      `${id}_nft_solana_collection_sniffer`,
      JSON.stringify(value),
      'EX',
      process.env.NFT_CACHE_EXPIRATION_SECONDS,
    );
  }

  async commitUpdatedNft(nft: MarketActionEntity) {
    const cache = await this.getCache(nft.mint);

    console.log(nft);

    this.eventEmitter.emit(
      'nft.updated',
      new NftUpdatedEvent({
        ...cache,
        mint: nft.mint,
        price: (nft as any).price,
        owner: (nft as any).owner,
        status: NftStatus.NFT_STATUS_CANCEL_LISTING,
        escrowAccount: (nft as any).escrowAccount,
        tokenAccount: (nft as any).tokenAccount,
        createdAt: new Date(nft.timestamp * 1000).toISOString(),
        marketplace: Marketplace.MARKETPLACE_MAGIC_EDEN,
        collection: {
          nfts: [],
          name: 'collection',
          address: 'address',
          floor: 0.123,
        },
      }),
    );

    if (cache != null) {
      this.logger.log(
        `Update cache for NFT ${nft.mint} with values: ${JSON.stringify(nft)}`,
      );

      await this.setCache(nft.mint, {
        mint: nft.mint,
        createdAt: new Date(nft.timestamp * 1000).toISOString(),
        price: 1,
        owner: 'ewr',
        status: NftStatus.NFT_STATUS_CANCEL_LISTING,
        rarity: 2,
        escrowAccount: '',
        tokenAccount: '',
        marketplace: Marketplace.MARKETPLACE_MAGIC_EDEN,
        collection: {
          name: 'collection',
          address: 'address',
          floor: 0.123,
        },
      });
    }
  }

  protected async getValue(id: string): Promise<Nft> {
    const data = await SolanaService.getNftDataByMint(id);
    const price = await SolanaService.price(id).catch(() => ({
      mint: '',
      price: 0,
      timestamp: 0,
    }));
    const rare = SolanaService.nftRarer(id, data.parsedData);

    return Promise.resolve({
      id,
      mint: price.mint,
      price: (price as any).price,
      rarity: rare[0].probability,
      owner: (price as any).owner,
      status: NftStatus.NFT_STATUS_CANCEL_LISTING,
      escrowAccount: (price as any).escrowAccount,
      tokenAccount: data.tokenAccount,
      createdAt: new Date(price.timestamp * 1000).toISOString(),
      marketplace: Marketplace.MARKETPLACE_MAGIC_EDEN,
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

  private static getNftDataByMint(mint: string) {
    return lastValueFrom(
      getNftDataByMint({
        connection: CONNECTION,
        mint: new PublicKey(mint),
      }),
    );
  }

  private static nftRarer(
    mint: string,
    parsedData: ParsedNFTData,
  ): { mint: string; probability: number }[] {
    return nftRarer([{ mint, parsedData }]);
  }

  private static price(id: string): Promise<MarketActionEntity> {
    return lastValueFrom(
      priceExtractor({ connection: CONNECTION, nft: new PublicKey(id) }),
    );
  }
}
