import Bull from 'bull';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import imageThumbnail from 'image-thumbnail';
import dotenv from 'dotenv';
import File from '../models/File.js';
import { fileQueue } from './queue.js';

dotenv.config();

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    return done(new Error('Missing fileId'));
  }

  if (!userId) {
    return done(new Error('Missing userId'));
  }

  const file = await File.findOne({ _id: fileId, userId });

  if (!file) {
    return done(new Error('File not found'));
  }

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(file.localPath, options);
    const thumbnailPath = `${file.localPath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }

  done();
});

// Initialize mongoose connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

console.log('Worker started');
