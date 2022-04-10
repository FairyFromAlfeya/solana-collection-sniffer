import { Injectable, OnModuleInit } from '@nestjs/common';
import { SolanaService } from './solana.service';
import {
  marketPlaceSource,
  CONNECTION,
  MAGIC_EDEN_MARKET_PLACE,
} from 'karneges-sbt';

@Injectable()
export class ConsumeService implements OnModuleInit {
  constructor(private readonly solanaService: SolanaService) {}

  async onModuleInit() {
    marketPlaceSource({
      connection: CONNECTION,
      marketPlaceProgram: MAGIC_EDEN_MARKET_PLACE,
    }).subscribe((nft) => this.solanaService.commitUpdatedNft(nft));
  }
}
