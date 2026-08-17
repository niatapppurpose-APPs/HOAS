import { MongoMemoryServer } from 'mongodb-memory-server';

const port = Number(process.env.PORT || 27017);

const mongod = await MongoMemoryServer.create({
  instance: { port, dbName: 'hoas' },
});
console.log('Dev MongoDB running at', mongod.getUri());
console.log('Press Ctrl+C to stop');

process.on('SIGINT', async () => {
  await mongod.stop();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await mongod.stop();
  process.exit(0);
});