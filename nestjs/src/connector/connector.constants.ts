import { Inject } from '@nestjs/common';

export const RMQ_CONNECTOR_CONFIG = 'RMQ_CONNECTOR_CONFIG';

export const InjectRmqConnector = () => {
  return Inject(RMQ_CONNECTOR_CONFIG);
};
