const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/multivendor_ecommerce';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[MongoDB] Connection Failed: ${err.message}`);
    console.warn(`[MongoDB] Note: If running locally without a MongoDB daemon, please start MongoDB service or provide a MongoDB Atlas URI in server/.env`);
  }
};

module.exports = connectDB;
