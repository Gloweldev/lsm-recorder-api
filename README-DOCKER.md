# LSM Web Recorder Backend - Docker Deployment

## 🚀 Despliegue en Producción

### Variables de Entorno Requeridas

Configura estas variables en Portainer:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=lsm-web-recorder
AWS_ENDPOINT=https://s3.glowel.com.mx
```

### Build y Deploy

```bash
# Build de la imagen
docker-compose build

# Iniciar el contenedor
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener
docker-compose down
```

### Health Check

El contenedor incluye un health check que verifica:
- Endpoint: `http://localhost:5000/api/health`
- Intervalo: cada 30 segundos
- Timeout: 10 segundos
- Reintentos: 3

### Verificación

```bash
# Verificar que el contenedor esté corriendo
docker ps | grep lsm-web-recorder-api

# Probar el endpoint de salud
curl http://localhost:5000/api/health

# Ver logs en tiempo real
docker logs -f lsm-web-recorder-api
```

### Troubleshooting

**Problema: Contenedor no inicia**
```bash
docker logs lsm-web-recorder-api
```

**Problema: No conecta a PostgreSQL**
- Verifica que `DATABASE_URL` esté correcta
- Asegúrate que el usuario tenga permisos en la tabla `videos`

**Problema: No conecta a MinIO**
- Verifica `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Confirma que el bucket `lsm-web-recorder` exista

### Actualización

```bash
# Pull del código nuevo
git pull

# Rebuild y restart
docker-compose up -d --build
```
