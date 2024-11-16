import { EmitBody } from '@asaje/rabbitmq-node-client';

export type RmqEmitOptions<T> = {
  listener: string;
} & EmitBody<T>;
