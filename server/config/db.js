const mongoose = require('mongoose');
const dns = require('dns');

// If local DNS fails to resolve SRV records on Windows, set reliable DNS servers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('[DNS] Warning setting DNS servers:', e.message);
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/multivendor_ecommerce';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[MongoDB] Connection Failed: ${err.message}`);
    console.warn(`[MongoDB] Note: If running locally without a MongoDB daemon, please start MongoDB service or check network DNS connectivity.`);
  }
};

module.exports = connectDB;
