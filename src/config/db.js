// src/config/db.js
// PostgreSQL connection pool and initialization

const { Pool } = require('pg');

/**
 * Parse DATABASE_URL and create connection config
 * Uses regex to handle special characters in passwords (like # and $)
 */
function parseConnectionString(url) {
    // Remove quotes if present
    const cleanUrl = url.replace(/^["']|["']$/g, '');

    // Remove ?schema=public or other query params (Prisma-specific)
    const urlWithoutParams = cleanUrl.split('?')[0];

    // Regex pattern: postgresql://user:password@host:port/database
    const regex = /^postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/;
    const match = urlWithoutParams.match(regex);

    if (!match) {
        console.error('DATABASE_URL recibida:', urlWithoutParams);
        throw new Error('DATABASE_URL inválida. Formato: postgresql://user:pass@host:port/database');
    }

    const [, user, password, host, port, database] = match;

    console.log(`📊 Conexión DB: ${user}@${host}:${port}/${database}`);

    return {
        host,
        port: parseInt(port, 10),
        database,
        user,
        password,
    };
}

// Create connection pool
const dbConfig = parseConnectionString(process.env.DATABASE_URL || '');
const pool = new Pool({
    ...dbConfig,
    // SSL solo si está explícitamente habilitado via PGSSLMODE
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    max: 10,
});

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ PostgreSQL conectado:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        throw error;
    }
}

/**
 * Initialize database schema - creates tables if they don't exist
 * Simplified: only palabra and s3_key (no usuario/edad)
 * @returns {Promise<void>}
 */
async function initializeSchema() {
    // Just validate that the table exists
    const checkTableQuery = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'videos'
    );
  `;

    try {
        const result = await pool.query(checkTableQuery);
        if (result.rows[0].exists) {
            console.log('✅ Tabla videos existe');
        } else {
            console.warn('⚠️  Tabla videos no existe - créala manualmente');
        }
    } catch (error) {
        console.error('❌ Error verificando esquema:', error.message);
        throw error;
    }
}

/**
 * Insert video metadata into database
 * @param {Object} videoData - { palabra, s3_key, session_id, sequence_number, session_started_at }
 * @returns {Promise<Object>} - Inserted row
 */
async function insertVideo({ palabra, s3_key, session_id, sequence_number, session_started_at }) {
    const query = `
    INSERT INTO videos (palabra, s3_key, session_id, sequence_number, session_started_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
    const values = [
        palabra.trim().toLowerCase(),
        s3_key,
        session_id || null,
        sequence_number || null,
        session_started_at || null
    ];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error insertando video:', error.message);
        throw error;
    }
}

/**
 * Get video count for a specific palabra
 * @param {string} palabra - The sign/word to count
 * @returns {Promise<number>} - Count of videos for that palabra
 */
async function getVideoCount(palabra) {
    const query = `
    SELECT COUNT(*) as count
    FROM videos
    WHERE palabra = $1
  `;

    try {
        const result = await pool.query(query, [palabra.trim().toLowerCase()]);
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('❌ Error obteniendo conteo:', error.message);
        throw error;
    }
}

/**
 * Get all videos with optional filters
 * @param {Object} filters - { palabra, limit, offset }
 * @returns {Promise<Array>}
 */
async function getVideos({ palabra, limit = 100, offset = 0 } = {}) {
    let query = 'SELECT * FROM videos WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (palabra) {
        query += ` AND palabra = $${paramIndex++}`;
        values.push(palabra.trim().toLowerCase());
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
}

/**
 * Get video statistics - list of all palabras with their counts
 * @returns {Promise<Array>} - [{ palabra: 'A', count: 50 }, ...]
 */
async function getVideoStats() {
    const query = `
    SELECT 
      palabra,
      COUNT(*) as count
    FROM videos
    GROUP BY palabra
    ORDER BY count DESC
  `;

    const result = await pool.query(query);
    return result.rows.map(row => ({
        palabra: row.palabra,
        count: parseInt(row.count, 10),
    }));
}

module.exports = {
    pool,
    testConnection,
    initializeSchema,
    insertVideo,
    getVideoCount,
    getVideos,
    getVideoStats,
};
