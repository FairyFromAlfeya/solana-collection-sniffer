import { ParsedNFTData } from 'karneges-sbt';
import { MetadataDataData } from '@metaplex-foundation/mpl-token-metadata';

export interface NftData {
  parsedData: ParsedNFTData;
  metaData: MetadataDataData;
  tokenAccount: string;
}
