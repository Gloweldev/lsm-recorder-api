// src/routes/videoRoutes.js
// Express routes for video API

const express = require('express');
const multer = require('multer');
const router = express.Router();
const videoController = require('../controllers/videoController');
const palabrasController = require('../controllers/palabrasController');

// Configure multer for memory storage (video files)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de video'), false);
        }
    },
});

// Health check
router.get('/health', videoController.healthCheck);

// Test S3 upload
router.get('/videos/test-upload', videoController.testS3Upload);

// Video routes
router.post('/videos/upload-url', videoController.getUploadUrl);
router.post('/videos/upload', upload.single('video'), videoController.uploadVideoProxy); // Proxy upload
router.post('/videos', videoController.saveVideoMetadata);
router.get('/videos', videoController.getVideos);
router.get('/videos/stats', videoController.getStats);
router.get('/videos/count/:palabra', videoController.getVideoCount);

// Delete video by session and sequence
router.delete('/videos/session/:sessionId/sequence/:sequenceNumber', videoController.deleteVideoBySession);

// Palabras routes
router.get('/palabras', palabrasController.getPalabras);
router.post('/palabras', palabrasController.createPalabra);
router.delete('/palabras/:id', palabrasController.deletePalabra);

module.exports = router;
