import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['folder', 'file', 'image'] },
  isPublic: { type: Boolean, default: false },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  localPath: { type: String, default: null }
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

export default File;
