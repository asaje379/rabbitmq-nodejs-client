import { EmitBody } from '@ensfierte/rmq-connector';

export type RmqEmitOptions<T> = {
  listener: string;
} & EmitBody<T>;
