import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';

async function startServer(): Promise<void> {
  // Connect to Database
  await connectDB();

  // Listen on PORT
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`🏥 Health check available at http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
    
    server.close(async () => {
      console.log('🛑 HTTP server closed.');
      await disconnectDB();
      console.log('👋 Goodbye!');
      process.exit(0);
    });

    // Force close after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('💥 Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('💥 Server initialization failed:', error);
  process.exit(1);
});
