import { createClient } from 'redis';

const REDIS_ERROR_EVENT = 'error';
const REDIS_CONNECTION_ERROR_MESSAGE = 'Redis client error: ';
const REDIS_CONNECTION_FAIL_MESSAGE = 'Failed to connect to Redis: ';
const REDIS_GET_FAIL_MESSAGE = 'Failed to get value for key ';
const REDIS_SET_FAIL_MESSAGE = 'Failed to set value for key ';
const REDIS_DEL_FAIL_MESSAGE = 'Failed to delete key ';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on(REDIS_ERROR_EVENT, (err) => {
      console.error(`${REDIS_CONNECTION_ERROR_MESSAGE}${err}`);
    });

    this.client.connect().catch((err) => {
      console.error(`${REDIS_CONNECTION_FAIL_MESSAGE}${err}`);
    });
  }

  async isAlive() {
    try {
      await this.client.ping();
      return true;
    } catch (err) {
      return false;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      console.error(`${REDIS_GET_FAIL_MESSAGE}${key}: ${err}`);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, { EX: duration });
    } catch (err) {
      console.error(`${REDIS_SET_FAIL_MESSAGE}${key}: ${err}`);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`${REDIS_DEL_FAIL_MESSAGE}${key}: ${err}`);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
