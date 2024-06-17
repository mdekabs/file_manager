import crypto from 'crypto';
import User from '../models/User.js';
import redisClient from '../utils/redis.js';
import { userQueue } from '../utils/queue.js';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const newUser = new User({ email, password: hashedPassword });

    await newUser.save();

    // Add job to the user queue
    await userQueue.add({ userId: newUser._id });

    return res.status(201).json({
      id: newUser._id,
      email: newUser.email,
    });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId, 'email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  }
}

export default UsersController;
