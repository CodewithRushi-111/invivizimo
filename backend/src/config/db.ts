import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB Disconnected');
  } catch (error) {
    console.error(`❌ MongoDB Disconnection Error: ${error instanceof Error ? error.message : error}`);
  }
}

// Listen for connection events
mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Runtime Error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected from server');
});
