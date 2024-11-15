import { SetMetadata } from '@nestjs/common';

export const RMQ_SCHEDULER_PROCESSOR_KEY = 'RMQ_SCHEDULER_PROCESSOR_KEY';
export const RMQ_SCHEDULER_PROCESS_KEY = 'RMQ_SCHEDULER_PROCESS_KEY';

export const RmqScheduler = (): ClassDecorator =>
  SetMetadata(RMQ_SCHEDULER_PROCESSOR_KEY, 'default');

export const RmqSchedule = (action: string): MethodDecorator =>
  SetMetadata(RMQ_SCHEDULER_PROCESS_KEY, action);
