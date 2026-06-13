const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/placement_tracker';
    
    // Connect with standard configuration suited for both Atlas and local fallback
    const conn = await mongoose.connect(connStr);
    
    console.log(`Database connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failure: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
