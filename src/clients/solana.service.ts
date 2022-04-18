import { Injectable, Logger } from '@nestjs/common';
import { CONNECTION, nftExtractor, ParsedNFTData } from 'karneges-sbt';
import { PublicKey } from '@solana/web3.js';
import { from, lastValueFrom, mergeMap, finalize } from 'rxjs';
import { Cacheable } from './interfaces/cachable.interface';
import { Nft } from '../manager/interfaces/nft.interface';
import { Redis } from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { NftStatus } from '../manager/interfaces/nft-status.interface';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NftChangedEvent } from '../events/nft-changed.event';
import { Marketplace } from '../manager/interfaces/marketplace.interface';
import { Price } from './interfaces/price.interface';
import { Collection } from '../manager/entities/collection.entity';
import { getNftData, getPrice, getRarity } from '../utils/solana.util';
import { CollectionChangedEvent } from '../events/collection-changed.event';

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

    this.eventEmitter.emit('nft.updated', new NftChangedEvent(value));
  }

  protected async getValue(id: string, extra?: string): Promise<Nft> {
    const data = await getNftData(id);
    await this.client.set(
      `${id}_nft_parsed_data_solana_collection_sniffer`,
      JSON.stringify(data.parsedData),
    );
    const price = await getPrice(id);

    return {
      collection: this.collections.get(extra),
      mint: id,
      price: price.price,
      rarity: 0,
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

  private updateNft(id: string, collection: string): Promise<void | Nft> {
    return this.removeCache(id).then(() => this.get(id, collection));
  }

  @OnEvent(['collection.created', 'collection.updated'])
  private handleCollectionUpdated(event: CollectionChangedEvent): void {
    this.collections.set(event.collection.id, event.collection);
  }

  @OnEvent('collection.outdated')
  private handleCollectionOutdated(
    event: CollectionChangedEvent,
  ): Promise<void | Nft> {
    this.logger.log(`Loading NFTs cache for collection ${event.collection.id}`);
    this.collections.set(event.collection.id, event.collection);

    return lastValueFrom(
      from(event.collection.nfts).pipe(
        mergeMap((id) => this.updateNft(id, event.collection.id), 15),
        finalize(() => {
          this.logger.log(
            `NFTs cache for collection ${event.collection.id} is loaded`,
          );

          this.eventEmitter.emit(
            'collection.nfts.loaded',
            new CollectionChangedEvent(event.collection),
          );
        }),
      ),
    );
  }

  @OnEvent('collection.removed')
  private handleCollectionRemoved(event: CollectionChangedEvent): void {
    event.collection.nfts.forEach((nft) => this.removeCache(nft));
    this.collections.delete(event.collection.id);
  }

  @OnEvent('collection.nfts.loaded')
  private async handleCollectionNftsLoaded(
    event: CollectionChangedEvent,
  ): Promise<void> {
    this.logger.log(`Loading rarity for collection ${event.collection.id}...`);
    const data: { mint: string; parsedData: ParsedNFTData }[] = [];

    for (const nft of event.collection.nfts) {
      this.logger.log(
        `Parsed data get: ${nft}_nft_parsed_data_solana_collection_sniffer`,
      );
      const parsed = await this.client
        .get(`${nft}_nft_parsed_data_solana_collection_sniffer`)
        .then((res) => JSON.parse(res));

      data.push({
        mint: nft,
        parsedData: parsed,
      });
    }

    const rarity = getRarity(data);

    for (const rare of rarity) {
      await this.getCache(rare.mint).then(async (cache) => {
        if (rare.probability > 0) {
          this.logger.log(`${rare.mint}: ${rare.probability}`);
        }

        await this.client.set(
          `${rare.mint}_nft_solana_collection_sniffer`,
          JSON.stringify({
            ...cache,
            rarity: rare.probability,
            collection: { id: cache.collection.id },
          }),
        );

        if (rare.probability > 0) {
          this.logger.log(
            await this.client.get(`${cache}_nft_solana_collection_sniffer`),
          );
        }
      });
    }

    this.eventEmitter.emit(
      'collection.rarity.loaded',
      new CollectionChangedEvent(event.collection),
    );
    this.logger.log(`Rarity for collection ${event.collection.id} is loaded`);
  }

  getCollection(id: string): Collection {
    return this.collections.get(id);
  }
}
