import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Nft } from './interfaces/nft.interface';
import { NftStatus } from './interfaces/nft-status.interface';
import { CollectionService } from './collection.service';
import { Logger } from '@nestjs/common';

@Processor('nft')
export class NftConsumer {
  private readonly logger = new Logger('NftConsumer');

  constructor(private readonly collectionService: CollectionService) {}

  @Process()
  async updateNft({ id, data }: Job<Nft>): Promise<boolean> {
    this.logger.log(`Processing job ${id} for NFT ${data.mint}`);

    const collection = await this.collectionService.getCollectionByIdOrThrow(
      data.collection.id,
    );

    if (
      data.status === NftStatus.NFT_STATUS_LISTING &&
      (!collection.floor || collection.floor > data.price)
    ) {
      this.logger.log(
        `New ${data.collection.id} collection floor: ${data.mint} - ${data.price}`,
      );

      await this.collectionService.updateCollection({
        id: data.collection.id,
        floor: data.price,
        floorNft: data.mint,
      });
    }

    return true;
  }
}
