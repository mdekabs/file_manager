import Bull from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const fileQueue = new Bull('fileQueue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

const userQueue = new Bull('userQueue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

export { fileQueue, userQueue };
