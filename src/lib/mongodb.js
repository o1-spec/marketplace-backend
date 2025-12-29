// src/lib/mongodb.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  console.log('🔄 Connecting to MongoDB:', MONGODB_URI);

  if (cached.conn) {
    console.log('✅ Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: 'marketplace',
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Failed to connect to MongoDB:', e);
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;