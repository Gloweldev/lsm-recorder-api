// src/app.js
// Express application configuration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const videoRoutes = require('./routes/videoRoutes');

const app = express();

// ==================== MIDDLEWARES ====================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ==================== ROUTES ====================

// API routes
app.use('/api', videoRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'LSM Web Recorder API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: 'GET /api/health',
            uploadUrl: 'POST /api/videos/upload-url',
            saveVideo: 'POST /api/videos',
            listVideos: 'GET /api/videos',
            stats: 'GET /api/videos/stats',
        },
    });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        path: req.path,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
    });
});

module.exports = app;
