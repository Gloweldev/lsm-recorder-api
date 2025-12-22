-- Create palabras table
CREATE TABLE IF NOT EXISTS palabras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_palabras_nombre ON palabras(nombre);

-- Update videos table to reference palabras (optional foreign key)
-- ALTER TABLE videos ADD COLUMN palabra_id INTEGER REFERENCES palabras(id);
-- For now, keep palabra as text but ensure it matches from palabras table
