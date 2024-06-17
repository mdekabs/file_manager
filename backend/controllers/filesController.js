import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import File from '../models/file.js';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import paginate from '../utils/pagination.js';
import getMimeType from '../utils/mimeTypes.js';
import { fileQueue } from '../utils/queue.js';

dotenv.config();

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE, 10) || 20;

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId, isPublic, data } = req.body;
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parentFile = await File.findOne({ _id: parentId, userId });
      if (!parentFile || parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent not found or is not a folder' });
      }
    }

    let localPath = null;
    if (type !== 'folder') {
      const fileData = Buffer.from(data, 'base64');
      const fileId = uuidv4();
      localPath = path.join(FOLDER_PATH, fileId);
      fs.writeFileSync(localPath, fileData);
    }

    const file = new File({
      userId: mongoose.Types.ObjectId(userId),
      name,
      type,
      isPublic: !!isPublic,
      parentId: parentId ? mongoose.Types.ObjectId(parentId) : '0',
      localPath,
    });

    await file.save();

    // Add job to the file queue for generating thumbnails if the file is an image
    if (type === 'image') {
      await fileQueue.add({ fileId: file._id, userId: file.userId });
    }

    return res.status(201).json({
      id: file._id,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
    });
  }

  // Other methods (getIndex, getShow, putPublish, putUnpublish, getFile) go here...
}

export default FilesController;
