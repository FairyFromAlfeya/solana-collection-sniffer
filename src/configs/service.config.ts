import { ClientOptions, Transport } from '@nestjs/microservices';
import { resolve } from 'path';

/**
 * Config for solana-collection-sniffer grpc service
 */
export const serviceConfig: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: `${process.env.HOST}:${process.env.PORT}`,
    package: 'com.fsociety.solanacollectionsniffer',
    protoPath: resolve('proto/solana-collection-sniffer.proto'),
  },
};
