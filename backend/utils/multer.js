const multer = require('multer');
const path = require('path');

// Allowed MIME types for images and videos
const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/webm'
];

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save everything in 'uploads' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to allow only supported formats
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Max 50MB file size
  }
});

module.exports = upload;
