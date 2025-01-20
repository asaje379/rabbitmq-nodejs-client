import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import {
  RMQ_LISTENER_PROCESS_KEY,
  RMQ_LISTENER_PROCESSOR_KEY,
} from './listener.constant';
import { RmqConnection, RmqServiceListener } from '@asaje/rabbitmq-node-client';
import { InjectRmqConnector } from '../connector/connector.constants';

@Injectable()
export class RmqListenerService implements OnModuleInit {
  private logger = new Logger('RmqListenerService');

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    @InjectRmqConnector() private connector: RmqConnection,
  ) {}

  async onModuleInit() {
    if (this.discoveryService) {
      const providers = this.discoveryService.getProviders();

      for (const provider of providers) {
        if (!provider.metatype) continue;

        const queueName = this.reflector.get(
          RMQ_LISTENER_PROCESSOR_KEY,
          provider.metatype,
        );
        if (queueName) {
          this.logger.log(`Rmq listener service found: ${queueName}`);
          const listener = new RmqServiceListener(this.connector);

          const instance = provider.instance;
          const methods = Object.getOwnPropertyNames(
            Object.getPrototypeOf(instance),
          );

          for (const methodName of methods) {
            const actionName = this.reflector.get(
              RMQ_LISTENER_PROCESS_KEY,
              instance[methodName],
            );
            if (actionName) {
              listener.use(queueName, {
                [actionName]: instance[methodName].bind(instance),
              });
              this.logger.log(
                `Start listening on queue ${queueName}, the action ${actionName} using ${methodName} method`,
              );
            }
          }
        }
      }
    }
  }
}
