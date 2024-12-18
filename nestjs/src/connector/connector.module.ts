import { DynamicModule, Logger, Module } from '@nestjs/common';
import { RMQ_CONNECTOR_CONFIG } from './connector.constants';
import { RmqConnection } from '@asaje/rabbitmq-node-client';
import { RmqConnectorModuleConfig } from './connector.typings';
import { DiscoveryModule } from '@nestjs/core';
import { RmqEmitterService } from '../emitter/emitter.service';
import { RmqListenerService } from '../listener/listener.service';
import { RmqSchedulerService } from '../scheduler/scheduler.service';

@Module({})
export class RmqConnectorModule {
  static forRootAsync(config: RmqConnectorModuleConfig): DynamicModule {
    return {
      imports: [DiscoveryModule],
      module: RmqConnectorModule,
      providers: [
        {
          provide: RMQ_CONNECTOR_CONFIG,
          useFactory: async () => {
            const connector = new RmqConnection();
            await connector.connect(config.uri);
            const logger = new Logger(RmqConnectorModule.name);
            logger.log('RmqConnectorModule initialized successfully');
            logger.log(`RabbitMQ listening on ${config.uri}`);
            return connector;
          },
        },
        RmqEmitterService,
        RmqListenerService,
        RmqSchedulerService,
      ],
      exports: [RmqEmitterService, RmqListenerService, RmqSchedulerService],
    };
  }
}
