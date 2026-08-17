import mongoose from 'mongoose';

const { connect, connection } = mongoose;

async function waitForMongo(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      await connect(url, { serverSelectionTimeoutMS: 1500 });
      await connection.close();
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

const url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hoas';
const ok = await waitForMongo(url);
console.log(ok ? 'mongo ready' : 'mongo NOT ready');
process.exit(ok ? 0 : 1);