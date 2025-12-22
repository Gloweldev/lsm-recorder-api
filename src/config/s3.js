// src/config/s3.js
// S3/MinIO client configuration and presigned URL generation

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Create S3 client configured for MinIO
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Test S3/MinIO connection - simple validation
 * Note: HeadBucket can fail through Cloudflare, so we just validate config
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    // Just validate that the client is configured correctly
    if (!BUCKET_NAME) {
        throw new Error('AWS_BUCKET_NAME no está configurado');
    }
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('Credenciales de AWS/MinIO no configuradas');
    }
    if (!process.env.AWS_ENDPOINT) {
        throw new Error('AWS_ENDPOINT no está configurado');
    }

    console.log(`✅ MinIO/S3 configurado. Bucket: ${BUCKET_NAME}`);
    console.log(`   Endpoint: ${process.env.AWS_ENDPOINT}`);
    return true;
}

/**
 * Generate a presigned URL for uploading a file
 * @param {string} fileName - Original file name
 * @param {string} fileType - MIME type (e.g., 'video/webm')
 * @param {number} expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns {Promise<{uploadUrl: string, key: string}>}
 */
async function generateUploadUrl(fileName, fileType, expiresIn = 300) {
    // Generate unique key with timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const extension = fileName.split('.').pop() || 'webm';
    const key = `videos/${timestamp}-${randomStr}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: fileType,
    });

    try {
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
        return { uploadUrl, key };
    } catch (error) {
        console.error('❌ Error generando URL prefirmada:', error.message);
        throw error;
    }
}

/**
 * Generate a presigned URL for downloading/viewing a file
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>}
 */
async function generateDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
        return downloadUrl;
    } catch (error) {
        console.error('❌ Error generando URL de descarga:', error.message);
        throw error;
    }
}

/**
 * Upload a file buffer directly to S3 (proxy upload to avoid CORS)
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - S3 key of uploaded file
 */
async function uploadToS3(buffer, fileName, contentType) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    // Always use .mp4 extension for videos
    const key = `videos/${timestamp}-${randomStr}.mp4`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    try {
        await s3Client.send(command);
        console.log(`✅ Video subido a S3: ${key}`);
        return key;
    } catch (error) {
        console.error('❌ Error subiendo a S3:', error.message);
        throw error;
    }
}

module.exports = {
    s3Client,
    testConnection,
    generateUploadUrl,
    generateDownloadUrl,
    uploadToS3,
    BUCKET_NAME,
};
