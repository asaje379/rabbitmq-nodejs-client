import { DynamicModule, Logger, Module } from '@nestjs/common';
import { RMQ_CONNECTOR_CONFIG } from './connector.constants';
import { RmqConnection } from '@asaje/rabbitmq-node-client';
import { RmqConnectorModuleConfig } from './connector.typings';
import { RmqEmitterService } from '../emitter/emitter.service';
import { RmqListenerService } from '../listener/listener.service';
import { RmqSchedulerService } from '../scheduler/scheduler.service';
import { RmqRunnerService } from '../runner';

@Module({})
export class RmqConnectorModule {
  static forRootAsync(config: RmqConnectorModuleConfig): DynamicModule {
    return {
      module: RmqConnectorModule,
      providers: [
        {
          provide: 'RmqDiscoveryService',
          useClass: config.discoveryService,
        },
        {
          provide: RMQ_CONNECTOR_CONFIG,
          useFactory: async () => {
            const connector = new RmqConnection();
            await connector.connect(config.uri);
            const logger = new Logger('RmqConnectorModule');
            logger.log('RmqConnectorModule initialized successfully');
            logger.log(`RabbitMQ listening on ${config.uri}`);
            return connector;
          },
        },
        RmqEmitterService,
        RmqListenerService,
        RmqSchedulerService,
        RmqRunnerService,
      ],
      exports: [
        RmqEmitterService,
        RmqListenerService,
        RmqSchedulerService,
        RmqRunnerService,
      ],
    };
  }
}
