// src/server.js
// Entry point - validates connections and starts server

require('dotenv').config();

const app = require('./app');
const db = require('./config/db');
const s3 = require('./config/s3');

const PORT = process.env.PORT || 5000;

/**
 * Validate all required environment variables
 */
function validateEnv() {
    const required = [
        'DATABASE_URL',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_BUCKET_NAME',
        'AWS_ENDPOINT',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Variables de entorno faltantes:');
        missing.forEach((key) => console.error(`   - ${key}`));
        process.exit(1);
    }

    console.log('✅ Variables de entorno validadas');
}

/**
 * Initialize all connections and start server
 */
async function startServer() {
    console.log('\n🚀 Iniciando LSM Web Recorder API...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        // Step 1: Validate environment
        validateEnv();

        // Step 2: Test PostgreSQL connection
        console.log('\n📦 Conectando a PostgreSQL...');
        await db.testConnection();

        // Step 3: Initialize database schema
        console.log('\n📋 Inicializando esquema de base de datos...');
        await db.initializeSchema();

        // Step 4: Test S3/MinIO connection (optional in dev)
        console.log('\n☁️  Conectando a MinIO/S3...');
        if (process.env.SKIP_S3_CHECK === 'true') {
            console.log('⚠️  SKIP_S3_CHECK=true - Omitiendo verificación de S3');
        } else {
            await s3.testConnection();
        }

        // Step 5: Start HTTP server
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        app.listen(PORT, () => {
            console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📚 Documentación: http://localhost:${PORT}/`);
            console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📹 Listo para recibir videos!\n');
        });

    } catch (error) {
        console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR CRÍTICO: No se pudo iniciar el servidor');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('\nDetalles:', error.message);
        console.error('\nVerifica:');
        console.error('  1. Que PostgreSQL esté corriendo y accesible');
        console.error('  2. Que las credenciales de MinIO/S3 sean correctas');
        console.error('  3. Que el bucket exista en MinIO/S3');
        console.error('  4. Que el archivo .env esté configurado correctamente\n');
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n⏳ Cerrando servidor...');
    await db.pool.end();
    console.log('✅ Conexiones cerradas. Adiós!');
    process.exit(0);
});

// Start the server
startServer();
