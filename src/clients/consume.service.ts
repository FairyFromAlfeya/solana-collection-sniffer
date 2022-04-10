import { Injectable, OnModuleInit } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { marketPlaceSource, CONNECTION } from 'karneges-sbt';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class ConsumeService implements OnModuleInit {
  constructor(private readonly solanaService: SolanaService) {}

  async onModuleInit() {
    marketPlaceSource({
      connection: CONNECTION,
      marketPlaceProgram: new PublicKey(
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      ),
    }).subscribe((nft) => this.solanaService.commitUpdatedNft(nft));
  }
}
