// src/controllers/videoController.js
// Business logic for video operations

const db = require('../config/db');
const s3 = require('../config/s3');

/**
 * Generate a presigned URL for video upload
 * POST /api/videos/upload-url
 */
async function getUploadUrl(req, res) {
    try {
        const { fileName, fileType } = req.body;

        // Validation
        if (!fileName || typeof fileName !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'fileName es requerido',
            });
        }

        if (!fileType || typeof fileType !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'fileType es requerido',
            });
        }

        // Validate file type is video
        if (!fileType.startsWith('video/')) {
            return res.status(400).json({
                success: false,
                error: 'Solo se permiten archivos de video',
            });
        }

        // Generate presigned URL
        const { uploadUrl, key } = await s3.generateUploadUrl(fileName, fileType);

        res.json({
            success: true,
            uploadUrl,
            key,
        });
    } catch (error) {
        console.error('Error en getUploadUrl:', error);
        res.status(500).json({
            success: false,
            error: 'Error generando URL de subida',
        });
    }
}

/**
 * Save video metadata after successful upload
 * POST /api/videos
 */
async function saveVideoMetadata(req, res) {
    try {
        const { palabra, s3_key } = req.body;

        // Validation
        if (!palabra || typeof palabra !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'palabra es requerido',
            });
        }

        if (!s3_key || typeof s3_key !== 'string') {
            return res.status(400).json({
                success: false,
                error: 's3_key es requerido',
            });
        }

        // Insert into database
        const video = await db.insertVideo({
            palabra,
            s3_key,
        });

        // Get updated count for this palabra
        const count = await db.getVideoCount(palabra);

        res.status(201).json({
            success: true,
            video,
            totalForPalabra: count,
        });
    } catch (error) {
        console.error('Error en saveVideoMetadata:', error);

        // Handle duplicate key error
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Este video ya fue registrado',
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error guardando metadata del video',
        });
    }
}

/**
 * Get video count for a specific palabra
 * GET /api/videos/count/:palabra
 */
async function getVideoCount(req, res) {
    try {
        const { palabra } = req.params;

        if (!palabra) {
            return res.status(400).json({
                success: false,
                error: 'palabra es requerido',
            });
        }

        const count = await db.getVideoCount(palabra);

        res.json({
            success: true,
            palabra: palabra.trim().toLowerCase(),
            count,
        });
    } catch (error) {
        console.error('Error en getVideoCount:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo conteo',
        });
    }
}

/**
 * Get list of videos with optional filters
 * GET /api/videos
 */
async function getVideos(req, res) {
    try {
        const { palabra, limit, offset } = req.query;

        const videos = await db.getVideos({
            palabra,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0,
        });

        res.json({
            success: true,
            count: videos.length,
            videos,
        });
    } catch (error) {
        console.error('Error en getVideos:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo videos',
        });
    }
}

/**
 * Get video statistics - list of all palabras with counts
 * GET /api/videos/stats
 */
async function getStats(req, res) {
    try {
        const stats = await db.getVideoStats();

        // Calculate totals
        const totalVideos = stats.reduce((sum, item) => sum + item.count, 0);

        res.json({
            success: true,
            totalVideos,
            totalPalabras: stats.length,
            palabras: stats,
        });
    } catch (error) {
        console.error('Error en getStats:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas',
        });
    }
}

/**
 * Health check endpoint
 * GET /api/health
 */
async function healthCheck(req, res) {
    try {
        // Test database connection
        await db.pool.query('SELECT 1');

        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
        });
    }
}

/**
 * Proxy upload: receive file and upload to S3 (avoids CORS)
 * POST /api/videos/upload
 * Expects multipart/form-data with 'video' file and 'palabra' field
 */
async function uploadVideoProxy(req, res) {
    try {
        const { palabra } = req.body;
        const file = req.file;

        // Validation
        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No se recibió archivo de video',
            });
        }

        if (!palabra || typeof palabra !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'palabra es requerido',
            });
        }

        console.log(`📤 Recibiendo video: ${file.originalname} (${file.size} bytes) para "${palabra}"`);

        // Upload to S3
        const s3_key = await s3.uploadToS3(file.buffer, file.originalname, file.mimetype);

        // Save metadata to DB
        const video = await db.insertVideo({
            palabra,
            s3_key,
        });

        // Get updated count
        const count = await db.getVideoCount(palabra);

        console.log(`✅ Video guardado: ${s3_key} (Total para "${palabra}": ${count})`);

        res.status(201).json({
            success: true,
            video,
            s3_key,
            totalForPalabra: count,
        });
    } catch (error) {
        console.error('❌ Error en uploadVideoProxy:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Este video ya fue registrado',
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error subiendo video: ' + error.message,
        });
    }
}

/**
 * TEST: Simple S3 upload test with small text file
 * GET /api/videos/test-upload
 */
async function testS3Upload(req, res) {
    try {
        console.log('🧪 Testing S3 upload...');
        const testBuffer = Buffer.from('Test upload from LSM backend');
        const testKey = await s3.uploadToS3(testBuffer, 'test.txt', 'text/plain');

        console.log('✅ Test upload successful:', testKey);

        res.json({
            success: true,
            message: 'S3 upload test successful',
            key: testKey,
        });
    } catch (error) {
        console.error('❌ Test upload failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            metadata: error.$metadata,
        });
    }
}

module.exports = {
    getUploadUrl,
    saveVideoMetadata,
    getVideoCount,
    getVideos,
    getStats,
    healthCheck,
    uploadVideoProxy,
    testS3Upload,
};
