import Bull from 'bull';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import imageThumbnail from 'image-thumbnail';
import dotenv from 'dotenv';
import File from '../models/file.js';
import { fileQueue, userQueue } from './queue.js';
import { sendWelcomeEmail } from "./mailer.js";
dotenv.config();

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

// Process fileQueue jobs
fileQueue.process(async (job, done) => {
  try {
    const { fileId, userId } = job.data;

    if (!fileId) {
      throw new Error('Missing fileId');
    }

    if (!userId) {
      throw new Error('Missing userId');
    }

    const file = await File.findOne({ _id: fileId, userId });

    if (!file) {
      throw new Error('File not found');
    }

    const sizes = [500, 250, 100];
    for (const size of sizes) {
      const options = { width: size };
      const thumbnail = await imageThumbnail(file.localPath, options);
      const thumbnailPath = `${file.localPath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    }

    done();
  } catch (error) {
    done(error);
  }
});

// Process userQueue jobs
userQueue.process(async (job, done) => {
  try {
    const { userId } = job.data;

    if (!userId) {
      throw new Error('Missing userId');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    console.log(`Welcome ${user.email}!`);
    await sendWelcomeEmail(user.email);

    done();
  } catch (error) {
    done(error);
  }
});

// Initialize mongoose connection
const DB = "mongodb+srv://1mawoda:Hovare001@cluster0.pzwtw9x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(DB);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

console.log('Worker started');
