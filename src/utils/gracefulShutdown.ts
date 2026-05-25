import { Server } from 'http';
import { logger } from './logger';

export const setupGracefulShutdown = (server: Server) => {
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        logger.info('Server closed');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error: Error) => {
    logger.error(`Unexpected error: ${error.message}`);
    exitHandler();
  };

  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
      server.close();
    }
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received');
    if (server) {
      server.close();
    }
  });
};
