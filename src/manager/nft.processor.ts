import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Nft } from './interfaces/nft.interface';
import { NftStatus } from './interfaces/nft-status.interface';
import { CollectionService } from './collection.service';
import { Logger } from '@nestjs/common';

@Processor('nft')
export class NftProcessor {
  private readonly logger = new Logger('NftProcessor');

  constructor(private readonly collectionService: CollectionService) {}

  @Process()
  async updateNft(job: Job<Nft>) {
    this.logger.log(
      `Processing of job ${job.id}, data: ${JSON.stringify({
        ...job.data,
        nfts: [],
      })}`,
    );

    const collection = await this.collectionService.getCollectionByIdOrThrow(
      job.data.collection.id,
    );

    if (
      job.data.status === NftStatus.NFT_STATUS_LISTING &&
      (!collection.floor || collection.floor > job.data.price)
    ) {
      await this.collectionService.updateCollection({
        id: job.data.collection.id,
        floor: job.data.price,
        floorNft: job.data.mint,
      });
    }

    return {};
  }
}
