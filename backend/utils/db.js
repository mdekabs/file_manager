import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DB_HOST = 'localhost';
const DEFAULT_DB_PORT = 27017;
const DEFAULT_DB_DATABASE = 'files_manager';
const DB_HOST = process.env.DB_HOST || DEFAULT_DB_HOST;
const DB_PORT = process.env.DB_PORT || DEFAULT_DB_PORT;
const DB_DATABASE = process.env.DB_DATABASE || DEFAULT_DB_DATABASE;
const MONGO_URI = process.env.DB;

const MONGODB_CONNECTION_ERROR_MESSAGE = 'Failed to connect to MongoDB: ';
const MONGODB_USER_COUNT_ERROR_MESSAGE = 'Failed to count documents in users collection: ';
const MONGODB_FILE_COUNT_ERROR_MESSAGE = 'Failed to count documents in files collection: ';

class DBClient {
  constructor() {
    this.connected = false;
    mongoose.connect(MONGO_URI)
      .then(() => {
        this.connected = true;
        console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error(`${MONGODB_CONNECTION_ERROR_MESSAGE}${err}`);
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      const count = await mongoose.connection.db.collection('users').countDocuments();
      return count;
    } catch (err) {
      console.error(`${MONGODB_USER_COUNT_ERROR_MESSAGE}${err}`);
      return 0;
    }
  }

  async nbFiles() {
    try {
      const count = await mongoose.connection.db.collection('files').countDocuments();
      return count;
    } catch (err) {
      console.error(`${MONGODB_FILE_COUNT_ERROR_MESSAGE}${err}`);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
