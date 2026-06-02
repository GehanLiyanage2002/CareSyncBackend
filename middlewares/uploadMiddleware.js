const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure memory storage to store files as buffers in RAM instead of disk
const storage = multer.memoryStorage();

// File filter for PDF, JPEG, PNG
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG and PNG files are allowed.'), false);
  }
};

// Initialize multer with storage, fileFilter, and a 10MB size limit
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
