# LSM Web Recorder Backend

API para recolección de videos del Dataset de Lenguaje de Señas Mexicano.

## Estructura
```
src/
├── config/
│   ├── db.js          # Pool PostgreSQL + auto-schema
│   └── s3.js          # MinIO/S3 + presigned URLs
├── controllers/
│   └── videoController.js
├── routes/
│   └── videoRoutes.js
├── app.js             # Express config
└── server.js          # Entry point
```

## Configuración

1. Copia `.env.example` a `.env` y configura las variables
2. Ejecuta `npm start` o `npm run dev`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/videos/upload-url` | Obtener URL prefirmada |
| `POST` | `/api/videos` | Guardar metadata |
| `GET` | `/api/videos` | Listar videos |
| `GET` | `/api/videos/stats` | Estadísticas |

## Uso

```bash
# Obtener URL para subir
curl -X POST http://localhost:5000/api/videos/upload-url \
  -H "Content-Type: application/json" \
  -d '{"fileName": "video.webm", "fileType": "video/webm"}'

# Guardar metadata después de subir
curl -X POST http://localhost:5000/api/videos \
  -H "Content-Type: application/json" \
  -d '{"usuario": "user123", "palabra": "hola", "edad": 25, "s3_key": "videos/xxx.webm"}'
```
