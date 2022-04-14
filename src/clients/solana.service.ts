import { Injectable, Logger } from '@nestjs/common';
import { CONNECTION, nftExtractor } from 'karneges-sbt';
import { PublicKey } from '@solana/web3.js';
import { lastValueFrom } from 'rxjs';
import { Cacheable } from './interfaces/cachable.interface';
import { Nft } from '../manager/interfaces/nft.interface';
import { Redis } from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { NftStatus } from '../manager/interfaces/nft-status.interface';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NftUpdatedEvent } from '../events/nft-updated.event';
import { Marketplace } from '../manager/interfaces/marketplace.interface';
import { Price } from './interfaces/price.interface';
import { Collection } from '../manager/entities/collection.entity';
import { CollectionRemovedEvent } from '../events/collection-removed.event';
import { CollectionUpdatedEvent } from '../events/collection-updated.event';
import { getNftData, getPrice, getRarity } from '../utils/solana.util';

@Injectable()
export class SolanaService extends Cacheable<Nft, string> {
  private readonly logger = new Logger('SolanaService');
  private readonly client: Redis;
  private readonly collections = new Map<string, Collection>();

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
    this.client = this.redisService.getClient();
  }

  protected getCache(id: string): Promise<Nft | null> {
    return this.client
      .get(`${id}_nft_solana_collection_sniffer`)
      .then((nft) => (nft ? JSON.parse(nft) : null))
      .then((nft) =>
        nft
          ? { ...nft, collection: this.collections.get(nft.collection.id) }
          : null,
      );
  }

  removeCache(id: string): Promise<string> {
    this.logger.log(`Remove cache for NFT ${id}`);
    return this.client.getdel(`${id}_nft_solana_collection_sniffer`);
  }

  protected async setCache(id: string, value: Nft): Promise<void> {
    this.logger.log(
      `Set cache for NFT ${id} with values: ${JSON.stringify({
        ...value,
        collection: { id: value.collection.id },
      })}`,
    );

    await this.client.set(
      `${id}_nft_solana_collection_sniffer`,
      JSON.stringify({ ...value, collection: { id: value.collection.id } }),
    );

    this.eventEmitter.emit('nft.updated', new NftUpdatedEvent(value));
  }

  protected async getValue(id: string, extra?: string): Promise<Nft> {
    const data = await getNftData(id);
    const rarity = getRarity(id, data.parsedData);
    const price = await getPrice(id);

    return {
      collection: this.collections.get(extra),
      mint: id,
      price: price.price,
      rarity: rarity.probability,
      owner: price.owner,
      status: NftStatus[`NFT_STATUS_${price.actionType}`],
      escrowAccount: price.escrowAccount,
      tokenAccount: data.tokenAccount,
      marketplace: Marketplace.MARKETPLACE_MAGIC_EDEN,
      createdAt: new Date(price.timestamp * 1000).toISOString(),
    };
  }

  async commitUpdatedNft(nft: Price): Promise<void> {
    const cache = await this.getCache(nft.mint);

    if (cache != null) {
      this.logger.log(
        `Update cache for NFT ${nft.mint} with values: ${JSON.stringify(nft)}`,
      );

      const updated = {
        ...cache,
        price: nft.price,
        owner: nft.owner,
        status: NftStatus[`NFT_STATUS_${nft.actionType}`],
        escrowAccount: nft.escrowAccount,
        createdAt: new Date(nft.timestamp * 1000).toISOString(),
      };

      await this.setCache(nft.mint, updated);
    }
  }

  extractNftsAddressesFromCollection(candyMachine: string): Promise<string[]> {
    return lastValueFrom(
      nftExtractor({
        candyMachine: new PublicKey(candyMachine),
        connection: CONNECTION,
      }),
    );
  }

  @OnEvent(['collection.created', 'collection.updated'])
  private handleCollectionUpdated(event: CollectionUpdatedEvent): void {
    this.collections.set(event.collection.id, event.collection);
  }

  @OnEvent('collection.outdated')
  private handleCollectionOutdated(event: CollectionRemovedEvent): void {
    event.collection.nfts.forEach(async (nft) => {
      await this.removeCache(nft);
      await this.get(nft);
    });
    this.collections.delete(event.collection.id);
  }

  @OnEvent('collection.removed')
  private handleCollectionRemoved(event: CollectionRemovedEvent): void {
    event.collection.nfts.forEach((nft) => this.removeCache(nft));
    this.collections.delete(event.collection.id);
  }
}
