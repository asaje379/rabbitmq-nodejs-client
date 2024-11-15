import { SetMetadata } from '@nestjs/common';

export const RMQ_LISTENER_PROCESSOR_KEY = 'RMQ_LISTENER_PROCESSOR_KEY';
export const RMQ_LISTENER_PROCESS_KEY = 'RMQ_LISTENER_PROCESS_KEY';

export const RmqListener = (queueName: string): ClassDecorator =>
  SetMetadata(RMQ_LISTENER_PROCESSOR_KEY, queueName);

export const RmqListen = (action: string): MethodDecorator =>
  SetMetadata(RMQ_LISTENER_PROCESS_KEY, action);
