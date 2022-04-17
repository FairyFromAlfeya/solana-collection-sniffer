import { NftData } from '../clients/interfaces/nft-data.interface';
import { lastValueFrom } from 'rxjs';
import {
  CONNECTION,
  getNftDataByMint,
  nftRarer,
  ParsedNFTData,
  priceExtractor,
} from 'karneges-sbt';
import { PublicKey } from '@solana/web3.js';
import { Rarity } from '../clients/interfaces/rarity.interface';
import { Price } from '../clients/interfaces/price.interface';

export const getNftData = (mint: string): Promise<NftData> =>
  lastValueFrom(
    getNftDataByMint({
      connection: CONNECTION,
      mint: new PublicKey(mint),
    }),
  );

export const getRarity = (
  data: { mint: string; parsedData: ParsedNFTData }[],
): Rarity[] => nftRarer(data);

export const getPrice = (nft: string): Promise<Price> =>
  lastValueFrom(
    priceExtractor({ connection: CONNECTION, nft: new PublicKey(nft) }),
  )
    .then((price) => price as Price)
    .catch(
      () =>
        ({
          price: 0,
          timestamp: Date.now(),
        } as Price),
    );
