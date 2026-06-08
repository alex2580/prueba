const multer = require('multer');
require('dotenv').config();

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP)'), false);
  }
}

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 5 },
});

// Runs AFTER multer — verifies actual file content via magic bytes,
// not just the client-supplied MIME type.
function validateMagicBytes(req, res, next) {
  const files = req.files || (req.file ? [req.file] : []);
  for (const file of files) {
    if (!file.buffer || file.buffer.length < 12) {
      return res.status(400).json({ error: `Archivo "${file.originalname}" inválido o corrupto` });
    }
    const b = file.buffer;
    const isJPEG = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    const isPNG  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
    const isWEBP = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                   b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    if (!isJPEG && !isPNG && !isWEBP) {
      return res.status(400).json({ error: `"${file.originalname}" no es una imagen válida` });
    }
  }
  next();
}

module.exports = { uploadMiddleware, validateMagicBytes };
