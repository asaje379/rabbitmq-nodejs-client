import { SetMetadata } from '@nestjs/common';

export const RMQ_RUNNER_PROCESSOR_KEY = 'RMQ_RUNNER_PROCESSOR_KEY';
export const RMQ_RUNNER_PROCESS_KEY = 'RMQ_RUNNER_PROCESS_KEY';

export const RmqRunner = (): ClassDecorator =>
  SetMetadata(RMQ_RUNNER_PROCESSOR_KEY, 'default');

export const RmqExecute = (action: string): MethodDecorator =>
  SetMetadata(RMQ_RUNNER_PROCESS_KEY, action);
