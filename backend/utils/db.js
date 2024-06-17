import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    this.connected = false;
    this._connect();
  }

  async _connect() {
    try {
      const database = process.env.DB_DATABASE || 'mongodb+srv://1mawoda:Hovare001@cluster0.pzwtw9x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
      await mongoose.connect(database);
      this.connected = true;
      console.log('MongoDB client connected successfully');
    } catch (err) {
      console.error('MongoDB client not connected to the server:', err);
    }
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      return await mongoose.connection.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users in MongoDB:', err);
      return 0;
    }
  }

  async nbFiles() {
    try {
      return await mongoose.connection.collection('files').countDocuments();
    } catch (err) {
      console.error('Error counting files in MongoDB:', err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
