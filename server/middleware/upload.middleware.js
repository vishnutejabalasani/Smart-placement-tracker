const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf' || file.mimetype === 'text/plain';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
