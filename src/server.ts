import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { setupGracefulShutdown } from './utils/gracefulShutdown';

const startServer = async () => {
  try {
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Initialize graceful shutdown handler
    setupGracefulShutdown(server);

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
