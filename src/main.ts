import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { serviceConfig } from './configs/service.config';
import { Logger } from '@nestjs/common';

// Start
NestFactory.create(AppModule)
  .then((app) =>
    Promise.resolve(app.connectMicroservice(serviceConfig)).then(() => app),
  )
  .then((app) => app.startAllMicroservices())
  .then((app) => app.listen(process.env.METRICS_PORT))
  .then(() => Logger.log('p2p-user-manager is started'));
