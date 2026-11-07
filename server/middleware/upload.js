const multer = require('multer');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter: accept images (JPEG, PNG, WEBP, SVG), PDF documents, and CSV spreadsheets
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.match(/\.(jpg|jpeg|png|webp|pdf|csv)$/i)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP), PDF documents, and CSV spreadsheets are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter,
});

module.exports = upload;
