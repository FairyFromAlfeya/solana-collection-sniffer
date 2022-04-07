import { ClientOptions, Transport } from '@nestjs/microservices';
import {
  SolanaCollectionSnifferProto,
  SOLANA_COLLECTION_SNIFFER_PROTO_PATH,
} from '@fairyfromalfeya/fsociety-proto';

export const serviceConfig: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: `${process.env.HOST}:${process.env.PORT}`,
    package:
      SolanaCollectionSnifferProto.COM_FSOCIETY_SOLANACOLLECTIONSNIFFER_PACKAGE_NAME,
    protoPath: SOLANA_COLLECTION_SNIFFER_PROTO_PATH,
  },
};
