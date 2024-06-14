import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import File from '../models/File.js';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import paginate from '../utils/pagination.js';
import getMimeType from '../utils/mimeTypes.js';

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

    return res.status(201).json({
      id: file._id,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;

    const query = { userId: mongoose.Types.ObjectId(userId) };

    if (parentId !== '0') {
      query.parentId = mongoose.Types.ObjectId(parentId);
    } else {
      query.parentId = '0';
    }

    const paginatedResult = await paginate(File, query, page, ITEMS_PER_PAGE, baseUrl);

    return res.status(200).json(paginatedResult);
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await File.findOne({ _id: id, userId });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.status(200).json({
      id: file._id,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updatedFile = await File.findOneAndUpdate({ _id: id, userId }, { isPublic: true }, { new: true });

    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.status(200).json({
      id: updatedFile._id,
      name: updatedFile.name,
      type: updatedFile.type,
      isPublic: updatedFile.isPublic,
      parentId: updatedFile.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updatedFile = await File.findOneAndUpdate({ _id: id, userId }, { isPublic: false }, { new: true });

    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.status(200).json({
      id: updatedFile._id,
      name: updatedFile.name,
      type: updatedFile.type,
      isPublic: updatedFile.isPublic,
      parentId: updatedFile.parentId,
    });
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await File.findOne({ _id: id });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.isPublic && file.userId.toString() !== userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: 'A folder doesn\'t have content' });
    }

    if (!file.localPath || !fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = getMimeType(file.name);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

    const fileStream = fs.createReadStream(file.localPath);
    fileStream.pipe(res);
  }
}

export default FilesController;
