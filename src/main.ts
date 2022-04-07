import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { serviceConfig } from './configs/service.config';
import { Logger } from '@nestjs/common';

NestFactory.createMicroservice(AppModule, serviceConfig)
  .then((app) => app.listen())
  .then(() => Logger.log('solana-collection-sniffer is started'));
