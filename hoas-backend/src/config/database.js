import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export async function connectDatabase() {
  if (env.mongoUri) {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    return;
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}