import { Injectable, Logger } from '@nestjs/common';
import {
  from,
  lastValueFrom,
  mergeMap,
  finalize,
  toArray,
  map,
  switchMap,
} from 'rxjs';
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
import { keepOnlyCollectionId } from '../utils/convert.util';

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

  protected async setCache(id: string, value: Nft): Promise<void> {
    this.logger.log(
      `Set cache for NFT ${id} with values: ${JSON.stringify(
        keepOnlyCollectionId(value),
      )}`,
    );

    await this.client
      .set(
        `${id}_nft_solana_collection_sniffer`,
        JSON.stringify(keepOnlyCollectionId(value)),
      )
      .then(() =>
        this.eventEmitter.emit('nft.updated', new NftChangedEvent(value)),
      );
  }

  protected async getValue(id: string, extra?: string): Promise<Nft> {
    const data = await getNftData(id);
    const price = await getPrice(id);

    await this.client.set(
      `${id}_nft_parsed_data_solana_collection_sniffer`,
      JSON.stringify(data.parsedData),
    );

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

  protected async removeCache(id: string): Promise<void> {
    this.logger.log(`Remove cache for NFT ${id}`);
    await this.client.getdel(`${id}_nft_solana_collection_sniffer`);
  }

  async commitUpdatedNft(nft: Price): Promise<void> {
    const cache = await this.getCache(nft.mint);

    if (cache != null) {
      await this.setCache(nft.mint, {
        ...cache,
        price: nft.price,
        owner: nft.owner,
        status: NftStatus[`NFT_STATUS_${nft.actionType}`],
        escrowAccount: nft.escrowAccount,
        createdAt: new Date(nft.timestamp * 1000).toISOString(),
      });
    }
  }

  getCollection(id: string): Collection {
    return this.collections.get(id);
  }

  private updateNft(id: string, collection: string): Promise<Nft> {
    return this.removeCache(id).then(() => this.get(id, collection));
  }

  private async loadNfts(collection: Collection): Promise<void> {
    this.logger.log(`Updating NFTs cache for collection ${collection.id}`);
    this.collections.set(collection.id, collection);
    this.eventEmitter.emit(
      'collection.loading.nfts',
      new CollectionChangedEvent(collection),
    );

    await lastValueFrom(
      from(collection.nfts).pipe(
        mergeMap((id) => this.updateNft(id, collection.id), 15),
        finalize(() => {
          this.logger.log(
            `NFTs cache for collection ${collection.id} is loaded`,
          );

          this.eventEmitter.emit(
            'collection.nfts.loaded',
            new CollectionChangedEvent(collection),
          );
        }),
      ),
    );
  }

  @OnEvent('collection.created')
  private handleCollectionCreated(event: CollectionChangedEvent): void {
    this.collections.set(event.collection.id, event.collection);
  }

  @OnEvent('collection.updated')
  private handleCollectionUpdated(event: CollectionChangedEvent): void {
    this.collections.set(event.collection.id, event.collection);
  }

  @OnEvent('collection.collection.loaded')
  private handleCollectionLoaded(event: CollectionChangedEvent): Promise<void> {
    return this.loadNfts(event.collection);
  }

  @OnEvent('collection.outdated')
  private handleCollectionOutdated(
    event: CollectionChangedEvent,
  ): Promise<void> {
    return this.loadNfts(event.collection);
  }

  @OnEvent('collection.removed')
  private handleCollectionRemoved(
    event: CollectionChangedEvent,
  ): Promise<void> {
    return lastValueFrom(
      from(event.collection.nfts).pipe(
        mergeMap((nft) => this.removeCache(nft)),
        finalize(() => this.collections.delete(event.collection.id)),
      ),
    );
  }

  @OnEvent('collection.nfts.loaded')
  private async handleCollectionNftsLoaded(
    event: CollectionChangedEvent,
  ): Promise<void> {
    this.logger.log(`Loading rarity for collection ${event.collection.id}...`);
    this.eventEmitter.emit(
      'collection.loading.rarity',
      new CollectionChangedEvent(event.collection),
    );

    return lastValueFrom(
      from(event.collection.nfts).pipe(
        mergeMap((nft) =>
          this.client
            .get(`${nft}_nft_parsed_data_solana_collection_sniffer`)
            .then((res) => {
              this.client.getdel(
                `${nft}_nft_parsed_data_solana_collection_sniffer`,
              );
              return res;
            })
            .then((res) => ({ parsedData: JSON.parse(res), mint: nft })),
        ),
        toArray(),
        map((data) => getRarity(data)),
        switchMap((rarities) => from(rarities)),
        mergeMap((rarity) =>
          this.getCache(rarity.mint).then((nft) =>
            this.setCache(rarity.mint, {
              ...nft,
              rarity: rarity.probability,
            }),
          ),
        ),
        finalize(() =>
          this.eventEmitter.emit(
            'collection.rarity.loaded',
            new CollectionChangedEvent(event.collection),
          ),
        ),
      ),
    );
  }
}
