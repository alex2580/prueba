const multer = require('multer');
require('dotenv').config();

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024; // 20MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'), false);
  }
}

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 10 },
});

module.exports = { uploadMiddleware };
