// src/controllers/palabrasController.js
// Controller for palabras CRUD operations

const db = require('../config/db');

/**
 * Get all palabras (with optional search)
 * GET /api/palabras?search=xxx
 */
async function getPalabras(req, res) {
    try {
        const { search } = req.query;
        const palabras = await db.getPalabras(search || '');

        res.json({
            success: true,
            palabras,
            count: palabras.length,
        });
    } catch (error) {
        console.error('❌ Error obteniendo palabras:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Create a new palabra
 * POST /api/palabras
 */
async function createPalabra(req, res) {
    try {
        const { nombre } = req.body;

        if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                error: 'nombre es requerido',
            });
        }

        // Check if already exists
        const existing = await db.getPalabraByNombre(nombre);
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'Palabra ya existe',
                palabra: existing,
            });
        }

        const palabra = await db.createPalabra(nombre);
        console.log(`✅ Palabra creada: ${palabra.nombre}`);

        res.status(201).json({
            success: true,
            palabra,
        });
    } catch (error) {
        console.error('❌ Error creando palabra:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Delete a palabra
 * DELETE /api/palabras/:id
 */
async function deletePalabra(req, res) {
    try {
        const { id } = req.params;

        const deleted = await db.deletePalabra(parseInt(id));
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Palabra no encontrada',
            });
        }

        console.log(`🗑️ Palabra eliminada: ${deleted.nombre}`);

        res.json({
            success: true,
            deleted,
        });
    } catch (error) {
        console.error('❌ Error eliminando palabra:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

module.exports = {
    getPalabras,
    createPalabra,
    deletePalabra,
};
