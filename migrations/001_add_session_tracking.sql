-- Migration: Add session tracking columns to videos table
-- Run this ONCE on your production database

-- Add new columns (nullable to not break existing records)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS session_id VARCHAR(12);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS sequence_number INTEGER;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups by session
CREATE INDEX IF NOT EXISTS idx_videos_session ON videos(session_id);

-- For existing records, generate a legacy session_id based on their ID
-- This ensures all records have a session_id
UPDATE videos 
SET session_id = 'LEGACY', 
    sequence_number = id,
    session_started_at = created_at
WHERE session_id IS NULL;

-- Verify migration
SELECT 
    id, 
    palabra, 
    session_id, 
    sequence_number, 
    session_started_at,
    created_at
FROM videos 
ORDER BY id DESC 
LIMIT 10;
